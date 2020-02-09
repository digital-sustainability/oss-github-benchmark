# Installation: pip3 install PyGithub

import json
import csv
from github import Github

# GitHub Login mittels Token
with open('keys.json', encoding='utf-8') as file:
    keys = json.load(file)
g = Github(keys["token"])

# JSON Daten laden, Variablen setzen
with open('github_repos.json', encoding='utf-8') as file:
    githubrepos = json.load(file)
institutions_data = []
counter = 0
sector = ""

# Alle Branchen rausholen
for sector, institutions in githubrepos["GitHubRepos"].items():
    print(sector)
    print("----------")
    # Von allen Branchen die Institutionen (Firmen, Behörden, Communities...) rausholen
    for institution in institutions:
        counter += 1
        print(counter)
        if counter > 1:
            break
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

        # Von einer Institution alle GitHub-Organisationen rausholen
        for org in institution["orgs"]:
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
                print("Crawling repo: " + repo.name)
                commit_activities = repo.get_stats_commit_activity()
                last_years_commits = 0
                # Alle Commits der letzten 12 Monate zusammenzählen
                if commit_activities != None:
                    for week in commit_activities:
                        last_years_commits += week.total
                # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
                repo_data = {
                    "name": repo.name,
                    "fork": repo.fork,
                    "num_forks": repo.forks_count,
                    "num_contributors": 0,#repo.get_contributors().totalCount,
                    "num_commits": repo.size,                # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
                    "num_stars": repo.stargazers_count,
                    "num_watchers": repo.watchers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
                    "last_years_commits": last_years_commits
                }
                # Stars, Contributors, Commits, Forks, Watchers und Last Year's Commits nur zählen wenn das Repo nicht geforkt ist
                if not repo_data["fork"]:
                    institution_data["total_num_stars"] += repo_data["num_stars"]
                    institution_data["total_num_contributors"] += repo_data["num_contributors"]
                    institution_data["total_num_commits"] += repo_data["num_commits"]
                    institution_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                    institution_data["total_num_watchers"] += repo_data["num_watchers"]
                    institution_data["total_commits_last_year"] += repo_data["last_years_commits"]
                # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
                else:
                    institution_data["total_num_forks_in_repos"] += 1
                institution_data["sector"] = sector
                institution_data["repos"].append(repo_data)
                repo_counter += 1                
                if repo_counter > 3:
                    break
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
    "avatar"
]
with open("OSSranking.csv", 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=csv_columns, extrasaction='ignore')
    writer.writeheader()
    for data in institutions_data:
        writer.writerow(data)

# Sortieren der Organisationen und dem CVS-String anhängen
# institutions_data.sort(key=lambda x: x[2], reverse=True)
print( json.dumps(institutions_data, indent=4))