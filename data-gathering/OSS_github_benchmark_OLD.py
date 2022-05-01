# Installation: pip3 install PyGithub

import json
import csv
import os
import traceback
import datetime
from github import Github
import github
import logging
import pickle
from time import sleep
from pymongo import MongoClient
from datetime import timezone
import datetime
import uuid
from bson import json_util
from alive_progress import alive_bar

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

# GitHub Login mittels Token
g = Github(os.environ['GITHUBTOKEN2'])

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

# JSON Daten laden, Variablen setzen
with open('github_repos.json', encoding='utf-8') as file:
    githubrepos = json.load(file)
institutions_data = []
sector_data = {}
repos_data = []
sector = ""
users = []
userLogins = []


def saveProgress():
    global i, j, currentDateAndTime
    collectionProgress.replace_one(
        {}, {"i": i, "j": j, "currentDateAndTime": currentDateAndTime}, upsert=True)


def getProgress():
    global i, j, currentDateAndTime, githubrepos, users, userLogins
    progress = collectionProgress.find_one({})
    if progress != None:
        i = progress["i"]
        j = progress["j"]
        currentDateAndTime = progress["currentDateAndTime"]
    else:
        collectionTodoInstitutions.delete_many({})
        collectionTodoInstitutions.insert_one(
            {"githubrepos": list(githubrepos["GitHubRepos"].items())})
        currentDateAndTime = datetime.datetime.now(
            timezone.utc).replace(tzinfo=timezone.utc)
        collectionRepositoriesNew.delete_many({})
        collectionUsersNew.delete_many({})
    githubrepos = collectionTodoInstitutions.find_one({})["githubrepos"]
    users = list(collectionUsersNew.find())
    userLogins = [user["login"] for user in users]


# Warte bis die vorherige Action fertig ist.
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


def tryUntilRateLimitNotExceeded(f=lambda: None, *args, **kwargs):
    while True:
        if g.rate_limiting[0] > 100:
            return(f(*args, **kwargs))
        sleep(1)
        if collectionRunning.find_one({}) == None:
            collectionRunning.insert_one({"Status": "running"})


def badStuff(dic):
    collectionBadStuff.insert_one(dic)


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


def crawlRepoAndUsers(repo, organization_data, institution_data):
    global currentDateAndTime, users, userLogins
    try:
        print(
            f"Crawling repo {repo.name} ({repoNo + 1}/{organization_data['num_repos']}) ")
        commit_activities = tryUntilRateLimitNotExceeded(
            repo.get_stats_commit_activity)
        # TODO: hinzufügen Könnte auch noch interessant sein: https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#get-the-weekly-commit-activity
        # code_frequency = get_stats_code_frequency()

        # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
        has_own_commits = 0
        if repo.parent:
            try:
                has_own_commits = tryUntilRateLimitNotExceeded(
                    repo.compare, repo.parent.owner.login + ":master", "master").ahead_by
            except github.GithubException:
                pass
        # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
        # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
        # GitHub Statistics: https://developer.github.com/v3/repos/statistics/#get-contributors-list-with-additions-deletions-and-commit-counts

        repo_data = {
            "name": repo.name,
            "uuid": str(uuid.uuid4()),
            "url": repo.html_url,
            "institution": institution_data["shortname"],
            "organization": organization_data["name"],
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
        repo_data["num_contributors"] = tryUntilRateLimitNotExceeded(
            repo.get_contributors).totalCount
        repo_data["issues_closed"] = tryUntilRateLimitNotExceeded(
            repo.get_issues, state="closed").totalCount
        repo_data["issues_all"] = tryUntilRateLimitNotExceeded(
            repo.get_issues, state="all").totalCount
        repo_data["pull_requests_closed"] = tryUntilRateLimitNotExceeded(
            repo.get_pulls, state="closed").totalCount
        repo_data["pull_requests_all"] = tryUntilRateLimitNotExceeded(
            repo.get_pulls, state="all").totalCount
        repo_data["comments"] = tryUntilRateLimitNotExceeded(
            repo.get_comments).totalCount
        repo_data["languages"] = tryUntilRateLimitNotExceeded(
            repo.get_languages)
        repo_data["num_commits"] = tryUntilRateLimitNotExceeded(
            repo.get_commits).totalCount

        contributors = tryUntilRateLimitNotExceeded(
            repo.get_contributors)
        repo_data["contributors"] = [
            user.login for user in contributors]
        with alive_bar(len(list(contributors))) as bar:
            for contributor in contributors:
                if collectionRunning.find_one({}) == None:
                    collectionRunning.insert_one({"Status": "running"})
                if not contributor.login in userLogins:
                    orgs = tryUntilRateLimitNotExceeded(contributor.get_orgs)
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
                        "contributions": {institution_data["shortname"]: {organization_data["name"]: {repo_data["name"]: contributor.contributions}}},
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
                        users[userLogins.index(contributor.login)]["contributions"][institution_data["shortname"]][organization_data["name"]
                                                                                                                   ][repo_data["name"]] = contributor.contributions
                    except:
                        [print(a, b) for (a, b) in zip(userLogins, users)]
                        raise
                bar()

        commits = tryUntilRateLimitNotExceeded(
            repo.get_commits)
        commiters = [
            commit.author.login for commit in commits if commit.author != None]
        coders = []
        for c in commiters:
            if not c in coders:
                coders.append(c)
        repo_data["coders"] = coders
        for c in commiters:
            if not c in organization_data["coders"]:
                organization_data["coders"].append(c)

        try:
            repo_data["license"] = tryUntilRateLimitNotExceeded(
                repo.get_license).license.name
        except github.GithubException:
            repo_data["license"] = "none"
        return repo_data
    except RuntimeError as error:
        print("Error occured while loading '" +
              repo.name + "' : " + str(error))
        try:
            badStuff(repo)
        except:
            try:
                badStuff(
                    {"error": f"error in repo {repo.name} of org {org_name}: {str(error)}"})
            except:
                badStuff(
                    {"error": f"error in org {org_name}: {str(error)}"})
        traceback.print_exc()
    except KeyboardInterrupt:
        raise
    except:
        try:
            badStuff(repo)
        except:
            try:
                badStuff(
                    {"error": f"error in repo {repo.name} of org {org_name}: {str(e)}"})
            except:
                badStuff(
                    {"error": f"error in org {org_name}"})
        traceback.print_exc()


# Alle Branchen rausholen
i = 0
j = 0
currentDateAndTime = 0
getProgress()
while i < len(githubrepos):
    sector_key, sector = list(githubrepos)[i]
    print("Sector: " + sector_key)
    sector_data[sector_key] = []
    # Von allen Branchen die Institutionen (Firmen, Behörden, Communities...) rausholen
    while j < len(sector["institutions"]):
        institution = sector["institutions"][j]
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
        error_counter = 0
        for orgNo, org_name in enumerate(institution["orgs"]):
            error_counter = 0
            try:
                print(f"{org_name} ({orgNo + 1}/{len(institution['orgs'])})")
                org = tryUntilRateLimitNotExceeded(
                    g.get_organization, org_name)
                organization_data = {}
                for dataName in dataToGet:
                    organization_data[dataName] = 0
                organization_data["name"] = org_name
                organization_data["url"] = org.html_url
                organization_data["description"] = org.description
                organization_data["num_members"] = tryUntilRateLimitNotExceeded(
                    org.get_members).totalCount
                organization_data["num_repos"] = org.public_repos
                organization_data["avatar"] = org.avatar_url
                organization_data["created_at"] = org.created_at
                organization_data["location"] = org.location
                organization_data["email"] = org.email
                organization_data["repos"] = []
                organization_data["coders"] = []
                # Die Anzahl GitHub-Organisationen, Members, Repos, Avatars (Link zu Icons) und die Organisations-Namen zu einer Institution hinzufügen
                institution_data["num_orgs"] += 1
                institution_data["num_members"] += organization_data["num_members"]
                institution_data["num_repos"] += organization_data["num_repos"]
                institution_data["avatar"].append(organization_data["avatar"])
                institution_data["org_names"].append(org_name)
                institution_data["sector"] = sector_key
                # Alle Repos einer GitHub-Organisation durch-loopen
                for repoNo, repo in enumerate(org.get_repos()):
                    if collectionRunning.find_one({}) == None:
                        collectionRunning.insert_one({"Status": "running"})
                    repo_data = crawlRepoAndUsers(
                        repo, organization_data, institution_data)

                    # Stars, Contributors, Commits, Forks, Watchers und Last Year's Commits nur zählen wenn das Repo nicht geforkt ist
                    if not repo_data["fork"]:
                        institution_data["total_num_stars"] += repo_data["num_stars"]
                        institution_data["total_num_contributors"] += repo_data["num_contributors"]
                        institution_data["total_num_commits"] += repo_data["num_commits"]
                        institution_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                        institution_data["total_num_watchers"] += repo_data["num_watchers"]
                        institution_data["total_pull_requests_all"] += repo_data["pull_requests_all"]
                        institution_data["total_pull_requests_closed"] += repo_data["pull_requests_closed"]
                        institution_data["total_issues_all"] += repo_data["issues_all"]
                        institution_data["total_issues_closed"] += repo_data["issues_closed"]
                        institution_data["total_comments"] += repo_data["comments"]
                        institution_data["repo_names"].append(
                            repo_data["name"])
                        # Das gleiche für die organization
                        organization_data["total_num_stars"] += repo_data["num_stars"]
                        organization_data["total_num_contributors"] += repo_data["num_contributors"]
                        organization_data["total_num_commits"] += repo_data["num_commits"]
                        organization_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                        organization_data["total_num_watchers"] += repo_data["num_watchers"]
                        organization_data["total_pull_requests_all"] += repo_data["pull_requests_all"]
                        organization_data["total_pull_requests_closed"] += repo_data["pull_requests_closed"]
                        organization_data["total_issues_all"] += repo_data["issues_all"]
                        organization_data["total_issues_closed"] += repo_data["issues_closed"]
                        organization_data["total_comments"] += repo_data["comments"]

                        if repo_data["license"] in institution_data["total_licenses"]:
                            institution_data["total_licenses"][repo_data["license"]] += 1
                        else:
                            institution_data["total_licenses"].update(
                                {repo_data["license"]: 1})

                    # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
                    else:
                        institution_data["total_num_forks_in_repos"] += 1
                        institution_data["total_num_commits"] += repo_data["has_own_commits"]
                        organization_data["total_num_forks_in_repos"] += 1
                        organization_data["total_num_commits"] += repo_data["has_own_commits"]
                        institution_data["repos"].append(repo_data)
                        organization_data["repos"].append(repo_data)
                        repos_data.append(repo_data)
                institution_data["orgs"].append(organization_data)
            except KeyboardInterrupt:
                raise
            except github.UnknownObjectException as e:
                try:
                    badStuff({"error": f"error in org {org_name}: {str(e)}"})
                except:
                    badStuff(f"{org_name}")
                traceback.print_exc()
        print("Number of GitHub repos of " +
              institution["name_de"] + ": " + str(institution_data["num_repos"]))
        institutions_data.append(institution_data)
        sector_data[sector_key].append(institution_data)

        institution_data["timestamp"] = currentDateAndTime
        inst_old = collectionInstitutions.find_one(
            {"uuid": institution_data["uuid"]})
        stat = {
            "timestamp": currentDateAndTime,
        }
        for statName in dataToGet:
            stat[statName] = institution_data[statName]
        institution_data["stats"] = [stat]
        if inst_old != None:
            stats = inst_old["stats"]
            stats.append(stat)
            institution_data["stats"] = stats
        collectionInstitutions.replace_one(
            {"uuid": institution_data["uuid"]}, institution_data, upsert=True)
        if len(institution_data["repos"]) != 0:
            collectionRepositoriesNew.insert_many(institution_data["repos"])
        print("Users:", *[u["login"] for u in users])
        if len(users) != 0:
            collectionUsersNew.insert_many(users)
        users = []
        j += 1
        saveProgress()
    i += 1
    j = 0

collectionProgress.delete_many({})

collectionRepositories.delete_many({})
collectionRepositoriesNew.aggregate([{"$match": {}}, {"$out": "repositories"}])

collectionUsers.delete_many({})
collectionUsersNew.aggregate([{"$match": {}}, {"$out": "users"}])

with open('github-data.pickle', 'wb') as file:
    pickle.dump(sector_data, file)

institutions_data = collectionInstitutions.find({},
                                                {
    "orgs": {"repos": {"commit_activities": 0}},
    "repos": {"commit_activities": 0},
    "_id": 0,
}
)
sector_data = {}
institutions = []
for institution in institutions_data:
    print(institution["shortname"])
    try:
        if len(sector_data[institution["sector"]]) >= 0:
            sector_data[institution["sector"]].append(institution)
            institutions.append(institution)
    except KeyError:
        sector_data[institution["sector"]] = []
institutions_data = institutions

csv_columns = [
    "sector",
    "name_de",
    "num_repos",
    "num_members",
    "total_num_contributors",
    "total_num_own_repo_forks",
    "total_num_forks_in_repos",
    "total_num_commits",
    "total_num_stars",
    "total_num_watchers",
    "total_pull_requests_all",
    "total_pull_requests_closed",
    "total_issues_all",
    "total_issues_closed",
    "total_comments",
    "org_names",
    "avatar",
    "repo_names",
    "total_licenses"
]
with open("oss-github-benchmark.csv", 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(
        csvfile, fieldnames=csv_columns, extrasaction='ignore')
    writer.writeheader()
    for data in institutions_data:
        writer.writerow(data)

# institutions_data.sort(key=lambda x: x[2], reverse=True)

with open("oss-github-benchmark.json", "w") as f:
    f.write(json.dumps(sector_data, default=json_util.default))

collectionRunning.delete_one({})