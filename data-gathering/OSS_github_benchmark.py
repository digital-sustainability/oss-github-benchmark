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

# JSON Daten laden, Variablen setzen
with open('github_repos.json', encoding='utf-8') as file:
    githubrepos = json.load(file)
institutions_data = []
sector_data = {}
repos_data = []
sector = ""

problematic_repos = {
    'repo_own_commit': [],
    'repo_load': [],
    'repo_other': []
}

def handle_rate_limit():
    reset_time = datetime.datetime.fromtimestamp(g.rate_limiting_resettime)
    logger.warning(f'rate limit exceeded, continuing on {reset_time}')
    while datetime.datetime.now() < reset_time:
        sleep(5)
        if collectionRunning.find_one({}) == None:
            collectionRunning.insert_one({"Status":"running"})

def saveProgress():
    global i, j, currentDateAndTime
    collectionProgress.replace_one({}, {"i": i, "j": j, "currentDateAndTime": currentDateAndTime}, upsert=True)

def getProgress():
    global i, j, currentDateAndTime, githubrepos
    progress = collectionProgress.find_one({})
    if progress != None:
        i = progress["i"]
        j = progress["j"]
        currentDateAndTime = progress["currentDateAndTime"]
    else:
        collectionTodoInstitutions.delete_many({})
        collectionTodoInstitutions.insert_one({"githubrepos": list(githubrepos["GitHubRepos"].items())})
        currentDateAndTime = datetime.datetime.now(timezone.utc).replace(tzinfo=timezone.utc)
        collectionRepositoriesNew.delete_many({})
    githubrepos = collectionTodoInstitutions.find_one({})["githubrepos"]

# Warte bis die vorherige Action fertig ist.
actionRunning = collectionRunning.find_one({}) != None
while actionRunning:
    collectionRunning.delete_one({})
    logger.warning("Action is already running. Trying again in one minute.")
    sleep(60)
    actionRunning = collectionRunning.find_one({}) != None

def tryUntilNoRateLimitExceeded(cmd):
    while True:
        try:
            result = eval(cmd)
            break
        except github.RateLimitExceededException:
            handle_rate_limit()
    return(result)

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
        j += 1
        print(j)
        institution_data = {
            "name_de": institution["name_de"],
            "uuid": institution["uuid"],
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
        for org_name in institution["orgs"]:
            try:
                print(org_name)
                org = tryUntilNoRateLimitExceeded("g.get_organization(org_name)")
                organization_data = {}
                for dataName in dataToGet:
                    organization_data[dataName] = 0
                organization_data["name"] = org_name
                organization_data["url"] = tryUntilNoRateLimitExceeded("org.html_url")
                organization_data["num_members"] = tryUntilNoRateLimitExceeded("org.get_members().totalCount")
                organization_data["num_repos"] = tryUntilNoRateLimitExceeded("org.public_repos")
                organization_data["avatar"] = tryUntilNoRateLimitExceeded("org.avatar_url")
                organization_data["repos"] = []
                # Die Anzahl GitHub-Organisationen, Members, Repos, Avatars (Link zu Icons) und die Organisations-Namen zu einer Institution hinzufügen
                institution_data["num_orgs"] += 1
                institution_data["num_members"] += organization_data["num_members"]
                institution_data["num_repos"] += organization_data["num_repos"]
                institution_data["avatar"].append(organization_data["avatar"])
                institution_data["org_names"].append(org_name)
                institution_data["sector"] = sector_key
                # Alle Repos einer GitHub-Organisation durch-loopen
                for repo in org.get_repos():
                    if collectionRunning.find_one({}) == None:
                        collectionRunning.insert_one({"Status":"running"})
                    if tryUntilNoRateLimitExceeded("repo.archived"):
                        continue
                    try:
                        print("Crawling repo: " + repo.name)
                        commit_activities = tryUntilNoRateLimitExceeded("repo.get_stats_commit_activity()")
                        last_years_commits = 0
                        # Alle Commits der letzten 12 Monate zusammenzählen
                        if commit_activities != None:
                            for week in commit_activities:
                                last_years_commits += tryUntilNoRateLimitExceeded("week.total")
                        # TODO: hinzufügen Könnte auch noch interessant sein: https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#get-the-weekly-commit-activity
                        # code_frequency = get_stats_code_frequency()

                        # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
                        has_own_commits = 0
                        if tryUntilNoRateLimitExceeded("repo.parent"):
                            try:
                                has_own_commits = tryUntilNoRateLimitExceeded('repo.compare(repo.parent.owner.login + ":master", "master").ahead_by')
                            except KeyboardInterrupt:
                                raise
                            except github.GithubException:
                                print(org_name)
                                print(tryUntilNoRateLimitExceeded("repo.parent.owner"))
                                problematic_repos['repo_own_commit'].append(repo)
                                traceback.print_exc()
                        # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
                        # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
                        # GitHub Statistics: https://developer.github.com/v3/repos/statistics/#get-contributors-list-with-additions-deletions-and-commit-counts
                        repo_data = {
                            "name": tryUntilNoRateLimitExceeded("repo.name"),
                            "url": tryUntilNoRateLimitExceeded("repo.html_url"),
                            "fork": tryUntilNoRateLimitExceeded("repo.fork"),
                            "num_forks": tryUntilNoRateLimitExceeded("repo.forks_count"),
                            "num_contributors": tryUntilNoRateLimitExceeded("repo.get_contributors().totalCount"),
                            "num_commits": tryUntilNoRateLimitExceeded("repo.get_commits().totalCount"),                # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
                            "num_stars": tryUntilNoRateLimitExceeded("repo.stargazers_count"),
                            "num_watchers": tryUntilNoRateLimitExceeded("repo.subscribers_count"),     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
                            "last_years_commits": tryUntilNoRateLimitExceeded("last_years_commits"),
                            "commit_activities": tryUntilNoRateLimitExceeded("[ a.raw_data for a in commit_activities ]"),
                            "has_own_commits": tryUntilNoRateLimitExceeded("has_own_commits"),       # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
                            "issues_closed": tryUntilNoRateLimitExceeded('repo.get_issues(state="closed").totalCount'),
                            "issues_all": tryUntilNoRateLimitExceeded('repo.get_issues(state="all").totalCount'),
                            "pull_requests_closed": tryUntilNoRateLimitExceeded('repo.get_pulls(state="closed").totalCount'),
                            "pull_requests_all": tryUntilNoRateLimitExceeded('repo.get_pulls(state="all").totalCount'),
                            "comments": tryUntilNoRateLimitExceeded("repo.get_comments().totalCount"),
                            "languages": tryUntilNoRateLimitExceeded("repo.get_languages()"),
                            "timestamp": currentDateAndTime,
                        }

                        try:
                            repo_data["license"] = tryUntilNoRateLimitExceeded(repo.get_license().license.key)
                        except KeyboardInterrupt:
                            raise
                        except:
                            repo_data["license"] = "none"

                        # Stars, Contributors, Commits, Forks, Watchers und Last Year's Commits nur zählen wenn das Repo nicht geforkt ist
                        if not repo_data["fork"]:
                            institution_data["total_num_stars"] += repo_data["num_stars"]
                            institution_data["total_num_contributors"] += repo_data["num_contributors"]
                            institution_data["total_num_commits"] += repo_data["num_commits"]
                            institution_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                            institution_data["total_num_watchers"] += repo_data["num_watchers"]
                            institution_data["total_commits_last_year"] += repo_data["last_years_commits"]
                            institution_data["total_pull_requests_all"] += repo_data["pull_requests_all"]
                            institution_data["total_pull_requests_closed"] += repo_data["pull_requests_closed"]
                            institution_data["total_issues_all"] += repo_data["issues_all"]
                            institution_data["total_issues_closed"] += repo_data["issues_closed"]
                            institution_data["total_comments"] += repo_data["comments"]
                            institution_data["repo_names"].append(repo_data["name"])
                            # Das gleiche für die organization
                            organization_data["total_num_stars"] += repo_data["num_stars"]
                            organization_data["total_num_contributors"] += repo_data["num_contributors"]
                            organization_data["total_num_commits"] += repo_data["num_commits"]
                            organization_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                            organization_data["total_num_watchers"] += repo_data["num_watchers"]
                            organization_data["total_commits_last_year"] += repo_data["last_years_commits"]
                            organization_data["total_pull_requests_all"] += repo_data["pull_requests_all"]
                            organization_data["total_pull_requests_closed"] += repo_data["pull_requests_closed"]
                            organization_data["total_issues_all"] += repo_data["issues_all"]
                            organization_data["total_issues_closed"] += repo_data["issues_closed"]
                            organization_data["total_comments"] += repo_data["comments"]

                            if repo_data["license"] in institution_data["total_licenses"]:
                                institution_data["total_licenses"][repo_data["license"]] += 1
                            else:
                                institution_data["total_licenses"].update({repo_data["license"]: 1})

                        # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
                        else:
                            institution_data["total_num_forks_in_repos"] += 1
                            institution_data["total_num_commits"] += repo_data["has_own_commits"]
                            organization_data["total_num_forks_in_repos"] += 1
                            organization_data["total_num_commits"] += repo_data["has_own_commits"]

                        institution_data["repos"].append(repo_data)
                        organization_data["repos"].append(repo_data)
                        repos_data.append(repo_data)
                    except RuntimeError as error:
                        print("Fehler beim Laden der Daten von '" + repo.name + "' :" + error)
                        problematic_repos['repo_load'].append(repo)
                        traceback.print_exc()
                        error_counter += 1
                        if error_counter > 100:
                            print("Laden der Daten wurde nach 100 fehlerhaften Abrufen abgebrochen")
                            continue
                    except KeyboardInterrupt:
                        raise
                    except NameError:
                        problematic_repos['repo_other'].append(repo)
                        traceback.print_exc()
                        error_counter += 1
                        if error_counter > 100:
                            print("Laden der Daten wurde nach 100 fehlerhaften Abrufen abgebrochen")
                            continue
                institution_data["orgs"].append(organization_data)
                if error_counter > 100:
                    break
            except KeyboardInterrupt:
                raise
            except:
                traceback.print_exc()
        print("Anzahl GitHub Repos von " + institution["name_de"] + ": " + str(institution_data["num_repos"]))
        institutions_data.append(institution_data)
        sector_data[sector_key].append(institution_data)

        institution_data["timestamp"] = currentDateAndTime
        inst_old = collectionInstitutions.find_one({ "uuid" : institution_data["uuid"] })
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
        collectionInstitutions.replace_one({ "uuid" : institution_data["uuid"] }, institution_data, upsert=True)
        try:
            collectionRepositoriesNew.insert_many(institution_data["repos"])
        except TypeError:
            pass
        saveProgress()
    i += 1
    j = 0

collectionProgress.delete_many({})

collectionRepositories.delete_many({})
collectionRepositoriesNew.aggregate([{ "$match": {} }, { "$out": "repositories" }])

with open('github-data.pickle', 'wb') as file:
    pickle.dump(sector_data, file)

collectionRunning.delete_one({})

csv_columns=[
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
    "total_commits_last_year",
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
    writer = csv.DictWriter(csvfile, fieldnames=csv_columns, extrasaction='ignore')
    writer.writeheader()
    for data in institutions_data:
        writer.writerow(data)


institutions_data.sort(key=lambda x: x[2], reverse=True)

print( json.dumps(institutions_data, indent=4))
f = open("oss-github-benchmark.json", "w")
f.write(json.dumps(sector_data))


# with open('problematic_repos.pickle', 'wb') as file:
#     pickle.dump(problematic_repos, file)
