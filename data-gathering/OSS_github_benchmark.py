# Installation: pip3 install PyGithub

import json
#Wird nur fürs csv gebraucht
# import csv
import os
import traceback
import datetime
from github import Github
import github
import logging
import pickle
from time import sleep, time
import pymongo
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
collectionRepositories = db["repositories"]

# JSON Daten laden, Variablen setzen
with open('github_repos.json', encoding='utf-8') as file:
    githubrepos = json.load(file)
institutions_data = []
sector_data = {}
repos_data = []
counter = 0
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
        sleep(1)

def saveProgress():
    global i, j, currentDateAndTime
    f = open("progress.txt", "w")
    f.write(str(i))
    f.close()
    f = open("progress.txt", "a")
    f.write("\n" + str(j))
    f.write("\n" + str(currentDateAndTime))
    f.close()

def getProgress():
    global i, j, currentDateAndTime
    try:
        with open("progress.txt", "r") as f:
            f = f.readlines()
            i = int(f[0])
            j = int(f[1])
            currentDateAndTime = f[2]
    except:
        currentDateAndTime = datetime.datetime.now(timezone.utc).replace(tzinfo=timezone.utc)
        collectionRepositories.delete_many({})

# Alle Branchen rausholen
i = 0
j = 0
currentDateAndTime = 0
getProgress()
print(i, j)
while i < len(githubrepos["GitHubRepos"].items()):
    sector_key, sector = list(githubrepos["GitHubRepos"].items())[i]
    print("Sector: " + sector_key)
    sector_data[sector_key] = []
    # Von allen Branchen die Institutionen (Firmen, Behörden, Communities...) rausholen
    while j < len(sector["institutions"]):
        institution = sector["institutions"][j]
        j += 1
        counter += 1
        print(counter)
        # Anzahl Institutionen eingrenzen
        # if counter > 2:
        #    break
        institution_data = {
            "name": institution["name"]
        }
        print(institution_data["name"])
        # Alle Werte einer Institution auf Null setzen
        institution_data["org_names"] = []
        institution_data["orgs"] = []
        institution_data["num_orgs"] = 0
        # Diese Werte existieren auf institution und organization ebene
        institution_data["num_repos"] = 0
        institution_data["num_members"] = 0
        institution_data["avatar"] = []
        institution_data["repos"] = []
        institution_data["total_num_contributors"] = 0
        institution_data["total_num_own_repo_forks"] = 0
        institution_data["total_num_forks_in_repos"] = 0
        institution_data["total_num_commits"] = 0
        institution_data["total_pull_requests"] = 0
        institution_data["total_issues"] = 0
        institution_data["total_num_stars"] = 0
        institution_data["total_num_watchers"] = 0
        institution_data["total_commits_last_year"] = 0
        institution_data["total_pull_requests_all"] = 0
        institution_data["total_pull_requests_closed"] = 0
        institution_data["total_issues_all"] = 0
        institution_data["total_issues_closed"] = 0
        institution_data["total_comments"] = 0
        institution_data["repo_names"] = []
        institution_data["total_licenses"] = {}

        # Von einer Institution alle GitHub-Organisationen rausholen
        error_counter = 0
        for org_name in institution["orgs"]:
            try:
                print(org_name)
                org = g.get_organization(org_name)
                organization_data = {}
                organization_data["name"] = org_name
                organization_data["url"] = org.html_url
                organization_data["num_members"] = org.get_members().totalCount
                organization_data["num_repos"] = org.public_repos
                organization_data["avatar"] = org.avatar_url
                organization_data["repos"] = []
                organization_data["total_num_contributors"] = 0
                organization_data["total_num_own_repo_forks"] = 0
                organization_data["total_num_forks_in_repos"] = 0
                organization_data["total_num_commits"] = 0
                organization_data["total_pull_requests"] = 0
                organization_data["total_issues"] = 0
                organization_data["total_num_stars"] = 0
                organization_data["total_num_watchers"] = 0
                organization_data["total_commits_last_year"] = 0
                organization_data["total_pull_requests_all"] = 0
                organization_data["total_pull_requests_closed"] = 0
                organization_data["total_issues_all"] = 0
                organization_data["total_issues_closed"] = 0
                organization_data["total_comments"] = 0

                # Die Anzahl GitHub-Organisationen, Members, Repos, Avatars (Link zu Icons) und die Organisations-Namen zu einer Institution hinzufügen
                institution_data["num_orgs"] += 1
                institution_data["num_members"] += organization_data["num_members"]
                institution_data["num_repos"] += organization_data["num_repos"]
                institution_data["avatar"].append(organization_data["avatar"])
                institution_data["org_names"].append(org_name)

                # Alle Repos einer GitHub-Organisation durch-loopen
                for repo in org.get_repos():
                    if repo.archived:
                        continue
                    try:
                        print("Crawling repo: " + repo.name)
                        commit_activities = repo.get_stats_commit_activity()
                        last_years_commits = 0
                        # Alle Commits der letzten 12 Monate zusammenzählen
                        if commit_activities != None:
                            for week in commit_activities:
                                last_years_commits += week.total

                        # TODO: hinzufügen Könnte auch noch interessant sein: https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#get-the-weekly-commit-activity
                        # code_frequency = get_stats_code_frequency()

                        # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
                        has_own_commits = 0
                        if repo.parent:
                            try:
                                has_own_commits = repo.compare(repo.parent.owner.login + ":master", "master").ahead_by
                            except KeyboardInterrupt:
                                raise
                            except:
                                print(org_name)
                                print(repo.parent.owner)
                                problematic_repos['repo_own_commit'].append(repo)
                                traceback.print_exc()

                        # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
                        # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
                        # GitHub Statistics: https://developer.github.com/v3/repos/statistics/#get-contributors-list-with-additions-deletions-and-commit-counts
                        repo_data = {
                            "name": repo.name,
                            "url": repo.html_url,
                            "fork": repo.fork,
                            "num_forks": repo.forks_count,
                            "num_contributors": repo.get_contributors().totalCount,
                            "num_commits": repo.get_commits().totalCount,                # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
                            "num_stars": repo.stargazers_count,
                            "num_watchers": repo.subscribers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
                            "last_years_commits": last_years_commits,
                            "commit_activities": [ a.raw_data for a in commit_activities ],
                            "has_own_commits": has_own_commits,       # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
                            "issues_closed": repo.get_issues(state="closed").totalCount,
                            "issues_all": repo.get_issues(state="all").totalCount,
                            "pull_requests_closed": repo.get_pulls(state="closed").totalCount,
                            "pull_requests_all": repo.get_pulls(state="all").totalCount,
                            "comments": repo.get_comments().totalCount,
                            "languages": repo.get_languages()
                        }

                        try:
                            repo_data["license"] = repo.get_license().license.key
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

                        institution_data["sector"] = sector_key
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
                            break
                    except github.RateLimitExceededException:
                        handle_rate_limit()
                        traceback.print_exc()
                    except KeyboardInterrupt:
                        raise
                    except:
                        problematic_repos['repo_other'].append(repo)
                        traceback.print_exc()
                        error_counter += 1
                        if error_counter > 100:
                            print("Laden der Daten wurde nach 100 fehlerhaften Abrufen abgebrochen")
                            break
                institution_data["orgs"].append(organization_data)
                if error_counter > 100:
                    break
            except github.RateLimitExceededException:
                handle_rate_limit()
                traceback.print_exc()
            except KeyboardInterrupt:
                raise
            except:
                traceback.print_exc()
        print("Anzahl GitHub Repos von " + institution["name"] + ": " + str(institution_data["num_repos"]))
        institutions_data.append(institution_data)
        sector_data[sector_key].append(institution_data)

        institution_data["timestamp"] = currentDateAndTime
        inst_old = collectionInstitutions.find_one({ "name" : institution_data["name"] })
        stat = {
            "timestamps": currentDateAndTime,
            "num_repos": institution_data["num_repos"],
            "num_members": institution_data["num_members"],
        }
        institution_data["stats"] = [stat]
        if inst_old != None:
            stats = inst_old["stats"]
            stats.append(stat)
            institution_data["stats"] = stats
        collectionInstitutions.replace_one({ "name" : institution_data["name"] }, institution_data, upsert=True)
        collectionRepositories.insert_many(institution_data["repos"])
        saveProgress()
    i += 1
    j = 0

os.remove("progress.txt")

with open('github-data.pickle', 'wb') as file:
    pickle.dump(sector_data, file)

#Wird nur fürs csv gebraucht
# csv_columns=[
#     "sector",
#     "name",
#     "num_repos",
#     "num_members",
#     "total_num_contributors",
#     "total_num_own_repo_forks",
#     "total_num_forks_in_repos",
#     "total_num_commits",
#     "total_num_stars",
#     "total_num_watchers",
#     "total_commits_last_year",
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
#     writer = csv.DictWriter(csvfile, fieldnames=csv_columns, extrasaction='ignore')
#     writer.writeheader()
#     for data in institutions_data:
#         writer.writerow(data)


# Sortieren der Organisationen und dem CVS-String anhängen
# institutions_data.sort(key=lambda x: x[2], reverse=True)

#JSON Output auf Konsole und in neues File
# print( json.dumps(institutions_data, indent=4))
#Wird nur fürs JSON-file gebraucht
# f = open("oss-github-benchmark.json", "w")
# f.write(json.dumps(sector_data))


# with open('problematic_repos.pickle', 'wb') as file:
#     pickle.dump(problematic_repos, file)
