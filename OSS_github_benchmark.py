# Installation: pip3 install PyGithub

import json
import csv
import os
from github import Github

# GitHub Login mittels Token
g = Github(os.environ['GITHUBTOKEN'])

# JSON Daten laden, Variablen setzen
with open('github_repos.json', encoding='utf-8') as file:
    githubrepos = json.load(file)
institutions_data = []
counter = 0
sector = ""

# Alle Branchen rausholen
for sector_key, sector in githubrepos["GitHubRepos"].items():
    print("Sector: " + sector_key)
    # Von allen Branchen die Institutionen (Firmen, Behörden, Communities...) rausholen
    for institution in sector["institutions"]:
        counter += 1
        print(counter)
        # Anzahl Institutionen eingrenzen
        # if counter > 5:
        #    break
        institution_data = {
            "name": institution["name"]
        }
        print(institution_data["name"])
        # Alle Werte einer Institution auf Null setzen
        institution_data["orgs"] = []
        institution_data["num_orgs"] = 0
        institution_data["num_repos"] = 0
        institution_data["num_members"] = 0
        institution_data["avatar"] = []
        institution_data["repos"] = []
        institution_data["total_num_contributors"] = 0
        institution_data["total_num_own_repo_forks"] = 0
        institution_data["total_num_forks_in_repos"] = 0
        institution_data["total_num_commits"] = 0
        institution_data["total_num_stars"] = 0
        institution_data["total_num_watchers"] = 0
        institution_data["total_commits_last_year"] = 0
        institution_data["repo_names"] = []

        # Von einer Institution alle GitHub-Organisationen rausholen
        error_counter = 0
        for org in institution["orgs"]:
            try:
                # Die Anzahl GitHub-Organisationen, Members, Repos, Avatars (Link zu Icons) und die Organisations-Namen zu einer Institution hinzufügen
                institution_data["num_orgs"] += 1
                institution_data["num_members"] += g.get_organization(org).get_members().totalCount
                institution_data["num_repos"] += g.get_organization(org).public_repos
                institution_data["avatar"].append(g.get_organization(org).avatar_url)
                institution_data["orgs"].append(org)

                # Alle Repos einer GitHub-Organisation durch-loopen
                repo_counter = 0
                for repo in g.get_organization(org).get_repos():
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
                        contributors = repo.get_stats_contributors()
                        if contributors != None:
                            num_contributors = len(contributors)

                        # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
                        has_own_commits = 0
                        if repo.parent:
                            has_own_commits = repo.compare(repo.parent.owner.login + ":master", "master").ahead_by

                        # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
                        # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
                        # GitHub Statistics: https://developer.github.com/v3/repos/statistics/#get-contributors-list-with-additions-deletions-and-commit-counts
                        repo_data = {
                            "name": repo.name,
                            "fork": repo.fork,
                            "num_forks": repo.forks_count,
                            "num_contributors": num_contributors,
                            "num_commits": repo.size,                # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
                            "num_stars": repo.stargazers_count,
                            "num_watchers": repo.subscribers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
                            "last_years_commits": last_years_commits,
                            "has_own_commits": has_own_commits,       # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
                            "closed_issues": repo.get_issues(state="closed").totalCount,
                            "all_issues": repo.get_issues(state="all").totalCount,
                            "closed_pull_requests": repo.get_pulls(state="closed").totalCount,
                            "all_pull_requests": repo.get_pulls(state="all").totalCount
                        }
                        # Stars, Contributors, Commits, Forks, Watchers und Last Year's Commits nur zählen wenn das Repo nicht geforkt ist
                        if not repo_data["fork"]:
                            institution_data["total_num_stars"] += repo_data["num_stars"]
                            institution_data["total_num_contributors"] += repo_data["num_contributors"]
                            institution_data["total_num_commits"] += repo_data["num_commits"]
                            institution_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                            institution_data["total_num_watchers"] += repo_data["num_watchers"]
                            institution_data["total_commits_last_year"] += repo_data["last_years_commits"]
                            institution_data["total_pull_requests"] += repo_data["all_pull_requests"]
                            institution_data["total_issues"] += repo_data["all_issues"]
                            institution_data["repo_names"].append(repo_data["name"])
                        # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
                        else:
                            institution_data["total_num_forks_in_repos"] += 1
                            institution_data["total_num_commits"] += repo_data["has_own_commits"]
                        institution_data["sector"] = sector_key
                        institution_data["repos"].append(repo_data)
                        repo_counter += 1
                        # Anzahl Repos pro Institution eingrenzen             
                        if repo_counter > 10:
                            break
                    except RuntimeError as error:
                        print("Fehler beim Laden der Daten von '" + repo.name + "' :" + error)
                        error_counter += 1
                        if error_counter > 100:
                            print("Laden der Daten wurde nach 100 fehlerhaften Abrufen abgebrochen")
                            break
                if error_counter > 100:
                    break
            except:
                pass
        print("Anzahl GitHub Repos von " + institution["name"] + ": " + str(institution_data["num_repos"]))
        institutions_data.append(institution_data)


csv_columns=[
    "sector",
    "name",
    "num_repos",
    "num_members",
    "total_num_contributors",
    "total_num_own_repo_forks",
    "total_num_forks_in_repos",
    # "total_num_commits",       Werte sind nicht korrekt
    "total_num_stars",
    # "total_num_watchers",      Watchers stimmen nicht, Zahlen sind identisch zu den Stars
    "total_commits_last_year",
    "orgs",
    "avatar",
    "repo_names"
]
with open("oss-github-benchmark.csv", 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=csv_columns, extrasaction='ignore')
    writer.writeheader()
    for data in institutions_data:
        writer.writerow(data)


# Sortieren der Organisationen und dem CVS-String anhängen
# institutions_data.sort(key=lambda x: x[2], reverse=True)

#JSON Output auf Konsole und in neues File
print( json.dumps(institutions_data, indent=4))
f = open("oss-github-benchmark.json", "w")
f.write(json.dumps(institutions_data, indent=4))
