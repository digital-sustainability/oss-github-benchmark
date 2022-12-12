# Imports

import json
import csv
import os
import datetime
from github import Github
import github
import logging
from time import sleep, gmtime
from pymongo import MongoClient
from datetime import timezone
import datetime
import uuid
from bson import json_util
from alive_progress import alive_bar
import threading
from mergedeep import merge
import calendar
import sys

# Set up logging (used once)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

# GitHub Login mittels Token
g = Github(os.environ['GITHUBTOKEN'])

# Database stuff
cluster = MongoClient(os.environ['DATABASELINK'])
db = cluster["statistics"]
collectionInstitutions = db["institutions"]
collectionRepositoriesNew = db["repositoriesNew"]
collectionProgress = db["progress"]
collectionRepositories = db["repositories"]
collectionRunning = db["running"]
collectionTodoInstitutions = db["todoInstitutions"]
collectionUsers = db["users"]
collectionUsersNew = db["usersNew"]
collectionBadStuff = db["badStuff"]

# Returns Date
def date():
    return datetime.datetime.now(
        timezone.utc).replace(tzinfo=timezone.utc)

# Returns Progress
def getProgress():
    progress = collectionProgress.find_one({})
    return progress

# Spams "running" into database
def running():
    while True:
        sleep(1)
        if collectionRunning.find_one({}) == None:
            collectionRunning.insert_one({"Status": "running"})

# Returns the number of sections
def getNumberOfSections():
    return len(githubConfig)

# Returns sector information
def getSectorInformation(sector):
    return githubConfig[sector]

# Replace progress entry
def saveProgress(progress):
    collectionProgress.replace_one(
        {}, progress, upsert=True)

# Crawl an institution
def crawlInstitution(currentInstitution):
    try:
        institutionData = getInstitution(
            sector["institutions"][currentInstitution], dataToGet)
        institutionData = updateStats(institutionData, dataToGet)
        saveInstitutionData(institutionData)
    except github.UnknownObjectException:
        print(
            f'Institution {sector["institutions"][currentInstitution]["name_de"]} is empty.')

# Wait for more call attempts (rate limiter)
def waitForCallAttempts(attempts=500):
    if g.rate_limiting[0] < attempts:
        print("Waiting for more call attemps...")
        sys.stdout.flush()
        core_rate_limit = g.get_rate_limit().core
        reset_timestamp = calendar.timegm(core_rate_limit.reset.timetuple())
        sleep_time = reset_timestamp - calendar.timegm(gmtime()) + 5
        sleep(sleep_time)

# Update stats of institution
def updateStats(institutionData, dataToGet):
    inst_old = collectionInstitutions.find_one(
        {"uuid": institutionData["uuid"]})
    stat = {
        "timestamp": date(),
    }
    for statName in dataToGet:
        stat[statName] = institutionData[statName]
    institutionData["stats"] = [stat]
    if inst_old != None:
        stats = inst_old["stats"]
        stats.append(stat)
        institutionData["stats"] = stats
    return institutionData

# Save an institution
def saveInstitution(institutionData):
    collectionInstitutions.replace_one(
        {"uuid": institutionData["uuid"]}, institutionData, upsert=True)

# Save a repo
def saveRepositories(repos):
    # pass
    if len(repos) != 0:
        collectionRepositoriesNew.insert_many(repos)

# ??? 
def popRepos(inst):
    repos = []
    for i, repo in enumerate(inst["repos"]):
        repos.append(repo)
        inst["repos"][i] = repo["uuid"]
    for j, org in enumerate(inst["orgs"]):
        for i, repo in enumerate(org["repos"]):
            inst["orgs"][j]["repos"][i] = repo["uuid"]
    return(repos)

# Get Users of repo (i guess?)
def popUsers(repos):
    users = []
    for i, repo in enumerate(repos):
        for j, contributor in enumerate(repo["contributors"]):
            users.append(contributor)
            repos[i]["contributors"][j] = contributor["login"]
    return(users)

# Save users
def saveUsers(users):
    with alive_bar(len(users)) as bar:
        for user in users:
            oldUser = collectionUsersNew.find_one({"login": user["login"]})
            if oldUser:
                mergedUsers = merge(user["contributions"],
                                    oldUser["contributions"])
                collectionUsersNew.update_one({"login": user["login"]}, {
                    "$set": {"contributions": mergedUsers}})
            else:
                collectionUsersNew.insert_one(user)
            bar()

# save insitution data
def saveInstitutionData(institutionData):
    repositories = popRepos(institutionData)
    users = popUsers(repositories)

    saveInstitution(institutionData)
    saveRepositories(repositories)
    saveUsers(users)

# Get users from repo (??)
def getUsers(contributors, instName, orgName, repoName):
    users = []
    waitForCallAttempts()
    try:
        contributors = [c for c in contributors]
    except github.GithubException:
        contributors = [c for c in contributors[0:500]]
    with alive_bar(len(contributors)) as bar:
        for contributor in contributors:
            waitForCallAttempts()
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
                "orgs": [org.login for org in orgs],
                # "repos": contributor.get_repos()
            })
            bar()
    return users

# Get Repo
def getRepository(repo, instName, orgName, orgAvatar):
    waitForCallAttempts()
    try:
        commit_activities = repo.get_stats_commit_activity()
    except RecursionError:
        commit_activities = None
    if not commit_activities == None:
        commit_activities = [a.raw_data for a in commit_activities]
    else:
        commit_activities = []

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

    repoData = {
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
        "commit_activities": commit_activities,
        # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
        "has_own_commits": has_own_commits,
        "issues_closed": 0,
        "issues_all": 0,
        "pull_requests_closed": 0,
        "pull_requests_all": 0,
        "comments": 0,
        "languages": [],
        "timestamp": date(),
        "createdTimestamp": repo.created_at,
        "updatedTimestamp": repo.updated_at,
        "logo": orgAvatar
    }

    contributors = repo.get_contributors()

    # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
    try:
        repoData["num_contributors"] = contributors.totalCount
    except github.GithubException:
        repoData["num_contributors"] = 501
    repoData["issues_closed"] = repo.get_issues(state="closed").totalCount
    repoData["issues_all"] = repo.get_issues(state="all").totalCount
    repoData["pull_requests_closed"] = repo.get_pulls(
        state="closed").totalCount
    repoData["pull_requests_all"] = repo.get_pulls(state="all").totalCount
    repoData["comments"] = repo.get_comments().totalCount
    repoData["languages"] = repo.get_languages()

    commiters = []
    try:
        commits = repo.get_commits()
        repoData["num_commits"] = commits.totalCount
        commiters = [
            commit.author.login for commit in commits if commit.author != None]
    except:
        commits = []
        repoData["num_commits"] = 0

    repoData["contributors"] = getUsers(
        contributors, instName, orgName, repoData["name"])

    coders = []
    for c in commiters:
        if not c in coders:
            coders.append(c)
    repoData["coders"] = coders

    try:
        repoData["license"] = repo.get_license().license.name
    except github.GithubException:
        repoData["license"] = "none"
    sys.stdout.flush()
    return repoData

# Get Organisation
def getOrganization(instName, orgName):
    waitForCallAttempts()
    org = g.get_organization(orgName)
    organizationData = {}
    for dataName in dataToGet:
        organizationData[dataName] = 0
    organizationData["name"] = orgName
    organizationData["url"] = org.html_url
    organizationData["description"] = org.description
    organizationData["num_members"] = org.get_members().totalCount
    organizationData["num_repos"] = org.public_repos
    organizationData["avatar"] = org.avatar_url
    organizationData["created_at"] = org.created_at
    organizationData["location"] = org.location
    organizationData["email"] = org.email
    organizationData["repos"] = []
    organizationData["repo_names"] = []
    organizationData["total_licenses"] = {}
    repos = [r for r in org.get_repos()]
    gatheredRepoData = []
    for i, r in enumerate(repos):
        waitForCallAttempts()
        print("Crawling repo", r.name, f"({i+1}/{len(repos)})")
        gatheredRepoData.append(getRepository(
            r, instName, orgName, organizationData["avatar"]))
    for repo in gatheredRepoData:
        if not repo["fork"]:
            organizationData["total_num_stars"] += repo["num_stars"]
            organizationData["total_num_contributors"] += repo["num_contributors"]
            organizationData["total_num_commits"] += repo["num_commits"]
            organizationData["total_num_own_repo_forks"] += repo["num_forks"]
            organizationData["total_num_watchers"] += repo["num_watchers"]
            organizationData["total_pull_requests_all"] += repo["pull_requests_all"]
            organizationData["total_pull_requests_closed"] += repo["pull_requests_closed"]
            organizationData["total_issues_all"] += repo["issues_all"]
            organizationData["total_issues_closed"] += repo["issues_closed"]
            organizationData["total_comments"] += repo["comments"]

            if repo["license"] in organizationData["total_licenses"]:
                organizationData["total_licenses"][repo["license"]] += 1
            else:
                organizationData["total_licenses"].update(
                    {repo["license"]: 1})

        # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
        else:
            organizationData["total_num_forks_in_repos"] += 1
            organizationData["total_num_commits"] += repo["has_own_commits"]
        organizationData["repos"].append(repo)
        organizationData["repo_names"].append(repo["name"])
    return(organizationData)

# Get Institution
def getInstitution(institution, dataToGet):
    print(institution["name_de"])
    institutionData = {
        "uuid": institution["uuid"],
        "shortname": institution["shortname"],
        "name_de": institution["name_de"],
    }
    for dataName in dataToGet:
        institutionData[dataName] = 0
    # Alle Werte einer Institution auf Null setzen
    institutionData["org_names"] = []
    institutionData["orgs"] = []
    institutionData["num_orgs"] = 0
    # Diese Werte existieren auf institution und organization ebene
    institutionData["avatar"] = []
    institutionData["repos"] = []
    institutionData["repo_names"] = []
    institutionData["total_licenses"] = {}
    institutionData["timestamp"] = date()
    # Von einer Institution alle GitHub-Organisationen rausholen
    currentOrganization = 0
    badOrgs = 0
    while currentOrganization < len(institution["orgs"]):
        orgName = institution["orgs"][currentOrganization]
        print(
            f"{orgName} ({currentOrganization + 1}/{len(institution['orgs'])})")
        try:
            organizationData = getOrganization(
                institution["shortname"], orgName)
            institutionData["orgs"].append(organizationData)
            # Die Anzahl GitHub-Organisationen, Members, Repos, Avatars (Link zu Icons) und die Organisations-Namen zu einer Institution hinzufügen
            institutionData["num_orgs"] += 1
            institutionData["num_members"] += organizationData["num_members"]
            institutionData["num_repos"] += organizationData["num_repos"]
            institutionData["avatar"].append(organizationData["avatar"])
            institutionData["org_names"].append(orgName)
            institutionData["sector"] = sector_key
            institutionData["total_num_stars"] += organizationData["total_num_stars"]
            institutionData["total_num_contributors"] += organizationData["total_num_contributors"]
            institutionData["total_num_commits"] += organizationData["total_num_commits"]
            institutionData["total_num_own_repo_forks"] += organizationData["total_num_own_repo_forks"]
            institutionData["total_num_watchers"] += organizationData["total_num_watchers"]
            institutionData["total_pull_requests_all"] += organizationData["total_pull_requests_all"]
            institutionData["total_pull_requests_closed"] += organizationData["total_pull_requests_closed"]
            institutionData["total_issues_all"] += organizationData["total_issues_all"]
            institutionData["total_issues_closed"] += organizationData["total_issues_closed"]
            institutionData["total_comments"] += organizationData["total_comments"]
            institutionData["repos"] += organizationData["repos"]
            institutionData["repo_names"] += organizationData["repo_names"]
            currentOrganization += 1
        except github.UnknownObjectException:
            print(f'Organization {orgName} does not exist.')
            collectionBadStuff.insert_one(
                {"orgName": orgName})
            print(f'{orgName} logged in badStuff.')
            if len(institution["orgs"]) != badOrgs + 1:
                badOrgs += 1
            else:
                raise
    return(institutionData)


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

# Als seperater Thread mitteilen, dass der Crawler läuft.
runningSignal = threading.Thread(target=running, daemon=True)
runningSignal.start()


try:
    while 1:
        # # JSON Daten laden, Variablen setzen
        # with open('github_repos.json', encoding='utf-8') as file:
        #     githubrepos = json.load(file)

        # Auf Fortschritt überprüfen.
        progress = getProgress()
        if progress != None:
            progressSector = progress["currentSector"]
            progressInstitution = progress["currentInstitution"]
        else:
            progressSector = 0
            progressInstitution = 0
            collectionUsersNew.delete_many({})
        githubrepos = collectionTodoInstitutions.find_one({})["githubrepos"]
        githubConfig = list(githubrepos)
        users = list(collectionUsersNew.find())

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
            "total_pull_requests_all",
            "total_pull_requests_closed",
            "total_issues_all",
            "total_issues_closed",
            "total_comments",
        ]

        currentSector = progressSector
        currentInstitution = progressInstitution
        while currentSector < getNumberOfSections():
            sector_key, sector = getSectorInformation(currentSector)
            print("Sector: " + sector_key)

            while currentInstitution < len(sector["institutions"]):
                crawlInstitution(currentInstitution)
                currentInstitution += 1
                progress = {}
                progress["currentSector"] = currentSector
                progress["currentInstitution"] = currentInstitution
                saveProgress(progress)

            currentInstitution = 0
            currentSector += 1

        collectionProgress.delete_many({})

        collectionRepositories.delete_many({})
        collectionRepositoriesNew.aggregate(
            [{"$match": {}}, {"$out": "repositories"}])

        collectionUsers.delete_many({})
        collectionUsersNew.aggregate([{"$match": {}}, {"$out": "users"}])
finally:
    sys.stdout.flush()

# institutions_data = collectionInstitutions.find({},
#                                                 {
#     "orgs": {"repos": {"commit_activities": 0}},
#     "repos": {"commit_activities": 0},
#     "_id": 0,
# }


# )
# sector_data = {}
# institutions = []
# for institution in institutions_data:
#     print(institution["shortname"])
#     try:
#         if len(sector_data[institution["sector"]]) >= 0:
#             sector_data[institution["sector"]].append(institution)
#             institutions.append(institution)
#     except KeyError:
#         sector_data[institution["sector"]] = []
# institutions_data = institutions

# csv_columns = [
#     "sector",
#     "name_de",
#     "num_repos",
#     "num_members",
#     "total_num_contributors",
#     "total_num_own_repo_forks",
#     "total_num_forks_in_repos",
#     "total_num_commits",
#     "total_num_stars",
#     "total_num_watchers",
#     "total_pull_requests_all",
#     "total_pull_requests_closed",
#     "total_issues_all",
#     "total_issues_closed",
#     "total_comments",
#     "org_names",
#     "avatar",
#     "repo_names",
#     "total_licenses"
# ]
# with open("oss-github-benchmark.csv", 'w', newline='', encoding='utf-8') as csvfile:
#     writer = csv.DictWriter(
#         csvfile, fieldnames=csv_columns, extrasaction='ignore')
#     writer.writeheader()
#     for data in institutions_data:
#         writer.writerow(data)

# # institutions_data.sort(key=lambda x: x[2], reverse=True)

# with open("oss-github-benchmark.json", "w") as f:
# f.write(json.dumps(sector_data, default=json_util.default))

collectionRunning.delete_one({})
