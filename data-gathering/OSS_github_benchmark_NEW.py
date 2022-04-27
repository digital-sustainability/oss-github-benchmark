import json
import csv
import os
from threading import currentThread
import traceback
import datetime
from github import Github
import github
import logging
import pickle
from time import sleep, time
from pymongo import MongoClient
from datetime import timezone
import datetime
import uuid
from bson import json_util
from alive_progress import alive_bar
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

# GitHub Login mittels Token
g = Github(os.environ['GITHUBTOKEN'])

cluster = MongoClient(os.environ['DATABASELINK'])
db = cluster["statistics"]
collectionInstitutions = db["institutions"]
collectionRepositoriesNew = db["repositoriesNew"]
collectionProgress = db["progress"]
collectionRepositories = db["repositories"]
collectionRunning = db["running"]
collectionTodoInstitutions = db["todoInstitutions"]
collectionBadStuff = db["badStuff"]
collectionUsers = db["users"]
collectionUsersNew = db["usersNew"]

startTime = time()


# JSON Daten laden, Variablen setzen
with open('github_repos.json', encoding='utf-8') as file:
    githubrepos = json.load(file)


def getProgress():
    progress = collectionProgress.find_one({})
    return progress != None


def waitForCallAttempts(attempts=100):
    while g.rate_limiting[0] < attempts:
        sleep(1)


def running():
    while True:
        sleep(1)
        if collectionRunning.find_one({}) == None:
            collectionRunning.insert_one({"Status": "running"})


# Warten bis die vorherige Action fertig ist.
actionRunning = collectionRunning.find_one({}) != None
if actionRunning:
    collectionRunning.delete_one({})
    sleep(3)
    actionRunning = collectionRunning.find_one({}) != None
    while actionRunning:
        collectionRunning.delete_one({})
        logger.warning(
            "Action is already running. Trying again in one minute.")
        sleep(60)
        actionRunning = collectionRunning.find_one({}) != None

# Auf Fortschritt überprüfen.
progress = getProgress()
if progress:
    currentDateAndTime = progress["currentDateAndTime"]
    currentSector = progress["currentSector"]
    currentInstitution = progress["currentInstitution"]
    currentOrganization = progress["currentOrganization"]
else:
    currentDateAndTime = datetime.datetime.now(
        timezone.utc).replace(tzinfo=timezone.utc)
    currentSector = 0
    currentInstitution = 0
    currentOrganization = 0
    collectionRepositoriesNew.delete_many({})
    collectionUsersNew.delete_many({})
    collectionTodoInstitutions.delete_many({})
    collectionTodoInstitutions.insert_one(
        {"githubrepos": list(githubrepos["GitHubRepos"].items())})
githubrepos = collectionTodoInstitutions.find_one({})["githubrepos"]
users = list(collectionUsersNew.find())
userLogins = [user["login"] for user in users]

# Als seperater Thread mitteilen, dass der Crawler läuft.
runningSignal = threading.Thread(target=running, daemon=True)
runningSignal.start()


def stopWhenTimeOver():
    if time() - startTime > 19800:
        quit()


def getUsers(users, instName, orgName, repoName):
    with alive_bar(len(list(users))) as bar:
        for contributor in users:
            if not contributor.login in userLogins:
                orgs = contributor.get_orgs()
                users.append({
                    "login": contributor.login,
                    "name": contributor.name,
                    "avatar_url": contributor.avatar_url,
                    "bio": contributor.bio,
                    "blog": contributor.blog,
                    "company": contributor.company,
                    "email": contributor.email,
                    "twitter_username": contributor.twitter_username,
                    "location": contributor.location,
                    "created_at": contributor.created_at,
                    "updated_at": contributor.updated_at,
                    "contributions": {instName: {orgName: {repoName: contributor.contributions}}},
                    "public_repos": contributor.public_repos,
                    "public_gists": contributor.public_gists,
                    "followers": contributor.followers,
                    "following": contributor.following,
                    "orgs": [org.name for org in orgs if org.name],
                    # "repos": contributor.get_repos()
                })
                userLogins.append(contributor.login)
            else:
                try:
                    users[userLogins.index(
                        contributor.login)]["contributions"][instName][orgName][repoName] = contributor.contributions
                except:
                    [print(a, b) for (a, b) in zip(userLogins, users)]
                    raise
            bar()


def getRepository(repo, instName, orgName):
    commit_activities = repo.get_stats_commit_activity
    # TODO: hinzufügen Könnte auch noch interessant sein: https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#get-the-weekly-commit-activity
    # code_frequency = get_stats_code_frequency()

    # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
    has_own_commits = 0
    if repo.parent:
        try:
            has_own_commits = repo.compare(
                repo.parent.owner.login + ":master", "master").ahead_by
        except github.GithubException:
            pass
    # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
    # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
    # GitHub Statistics: https://developer.github.com/v3/repos/statistics/#get-contributors-list-with-additions-deletions-and-commit-counts

    repo_data = {
        "name": repo.name,
        "uuid": str(uuid.uuid4()),
        "url": repo.html_url,
        "institution": instName,
        "organization": orgName,
        "description": repo.description,
        "fork": repo.fork,
        "archived": repo.archived,
        "num_forks": repo.forks_count,
        "num_contributors": 0,
        "num_commits": 0,
        "num_stars": repo.stargazers_count,
        # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
        "num_watchers": repo.subscribers_count,
        "commit_activities": [
            a.raw_data for a in commit_activities],
        # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
        "has_own_commits": has_own_commits,
        "issues_closed": 0,
        "issues_all": 0,
        "pull_requests_closed": 0,
        "pull_requests_all": 0,
        "comments": 0,
        "languages": [],
        "timestamp": currentDateAndTime,
        "createdTimestamp": repo.created_at,
        "updatedTimestamp": repo.updated_at,
    }

    # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
    repo_data["num_contributors"] = repo.get_contributors().totalCount
    repo_data["issues_closed"] = repo.get_issues(state="closed").totalCount
    repo_data["issues_all"] = repo.get_issues(state="all").totalCount
    repo_data["pull_requests_closed"] = repo.get_pulls(
        state="closed").totalCount
    repo_data["pull_requests_all"] = repo.get_pulls(state="all").totalCount
    repo_data["comments"] = repo.get_comments().totalCount
    repo_data["languages"] = repo.get_languages()
    repo_data["num_commits"] = repo.get_commits().totalCount

    contributors = repo.get_contributors()
    repo_data["contributors"] = [
        user.login for user in contributors]

    commits = repo.get_commits()
    commiters = [
        commit.author.login for commit in commits if commit.author != None]
    coders = []
    for c in commiters:
        if not c in coders:
            coders.append(c)
    repo_data["coders"] = coders

    try:
        repo_data["license"] = repo.get_license().license.name
    except github.GithubException:
        repo_data["license"] = "none"
    return repo_data


def getOrganization(org_name):
    org = g.get_organization, org_name
    organization_data = {}
    for dataName in dataToGet:
        organization_data[dataName] = 0
    organization_data["name"] = org_name
    organization_data["url"] = org.html_url
    organization_data["description"] = org.description
    organization_data["num_members"] = org.get_members.totalCount
    organization_data["num_repos"] = org.public_repos
    organization_data["avatar"] = org.avatar_url
    organization_data["created_at"] = org.created_at
    organization_data["location"] = org.location
    organization_data["email"] = org.email
    organization_data["repos"] = []
    organization_data["coders"] = []
    # Alle Repos einer GitHub-Organisation durch-loopen
    for repoNo, repo in enumerate(org.get_repos()):
        print(
            f"Crawling repo {repo.name} ({repoNo + 1}/{organization_data['num_repos']}) ")
        repo_data = getRepository(repo)
    institution_data["orgs"].append(organization_data)


def getInstitution(institution, dataToGet):
    global currentOrganization
    institution_data = {
        "uuid": institution["uuid"],
        "shortname": institution["shortname"],
        "name_de": institution["name_de"],
    }
    for dataName in dataToGet:
        institution_data[dataName] = 0
    print(institution_data["name_de"])
    # Alle Werte einer Institution auf Null setzen
    institution_data["org_names"] = []
    institution_data["orgs"] = []
    institution_data["num_orgs"] = 0
    # Diese Werte existieren auf institution und organization ebene
    institution_data["avatar"] = []
    institution_data["repos"] = []
    institution_data["repo_names"] = []
    institution_data["total_licenses"] = {}
    # Von einer Institution alle GitHub-Organisationen rausholen
    while currentOrganization < len(institution["orgs"]):
        print(
            f"{institution['orgs'][currentOrganization]} ({currentOrganization + 1}/{len(institution['orgs'])})")
        getOrganization(institution["orgs"][currentOrganization])
        currentOrganization += 1


dataToGet = [
    "num_repos",
    "num_members",
    "total_num_contributors",
    "total_num_own_repo_forks",
    "total_num_forks_in_repos",
    "total_num_commits",
    "total_pull_requests",
    "total_issues",
    "total_num_stars",
    "total_num_watchers",
    "total_commits_last_year",
    "total_pull_requests_all",
    "total_pull_requests_closed",
    "total_issues_all",
    "total_issues_closed",
    "total_comments",


]

while currentSector < len(githubrepos):
    sector_key, sector = list(githubrepos)[currentSector]
    print("Sector: " + sector_key)

    institution_data = getInstitution(
        sector["institutions"][currentSector], dataToGet)
    collectionInstitutions.replace_one(
        {"uuid": institution_data["uuid"]}, institution_data, upsert=True)
    currentSector += 1
