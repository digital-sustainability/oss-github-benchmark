
# Generate data

__dependencies: `docker`__

```
docker build -t oss-github .
docker --name oss-github-runner run --rm oss-github
docker rm oss-github-runner
docker rmi oss-github
```

# Start Visualization

__dependencies: `node`__

```
npm install
npm start
```

# Roadmap

- [x] show repository list
- [x] add selection of dimensions
- [x] Achsenbeschriftung
- [x] add sunburst visualization
- [x] improved data gathering
    - [x] when fork collect number of commits different from fork
- [x] fix problems when collecting data (sometimes sector and others are missing)
- [ ] fix hover being misplaced
    

# new data

```
diff --git a/OSS_github_benchmark.py b/OSS_github_benchmark.py
index 6c6d670..405a29a 100644
--- a/OSS_github_benchmark.py
+++ b/OSS_github_benchmark.py
@@ -55,7 +55,7 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                 institution_data["num_repos"] += g.get_organization(org).public_repos
                 institution_data["avatar"].append(g.get_organization(org).avatar_url)
                 institution_data["orgs"].append(org)
-
+                
                 # Alle Repos einer GitHub-Organisation durch-loopen
                 repo_counter = 0
                 for repo in g.get_organization(org).get_repos():
@@ -74,9 +74,9 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                             num_contributors = len(contributors)
 
                         # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
-                        has_own_commits = 0
+                        is_origin = 0
                         if repo.parent:
-                            has_own_commits = repo.compare(repo.parent.owner.login + ":master", "master").ahead_by
+                            is_origin = repo.compare(repo.parent.owner.login + ":master", "master").ahead_by
 
                         # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
                         # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
@@ -88,13 +88,9 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                             "num_contributors": num_contributors,
                             "num_commits": repo.size,                # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
                             "num_stars": repo.stargazers_count,
-                            "num_watchers": repo.subscribers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
-                            "last_years_commits": last_years_commits,
-                            "has_own_commits": has_own_commits,       # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
-                            "closed_issues": repo.get_issues(state="closed").totalCount,
-                            "all_issues": repo.get_issues(state="all").totalCount,
-                            "closed_pull_requests": repo.get_pulls(state="closed").totalCount,
-                            "all_pull_requests": repo.get_pulls(state="all").totalCount
+                            "num_watchers": repo.watchers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
+                            "last_years_commits": last_years_commits
+                            "is_origin": is_origin
                         }
                         # Stars, Contributors, Commits, Forks, Watchers und Last Year's Commits nur zählen wenn das Repo nicht geforkt ist
                         if not repo_data["fork"]:
@@ -104,13 +100,10 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                             institution_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                             institution_data["total_num_watchers"] += repo_data["num_watchers"]
                             institution_data["total_commits_last_year"] += repo_data["last_years_commits"]
-                            institution_data["total_pull_requests"] += repo_data["all_pull_requests"]
-                            institution_data["total_issues"] += repo_data["all_issues"]
                             institution_data["repo_names"].append(repo_data["name"])
                         # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
                         else:
                             institution_data["total_num_forks_in_repos"] += 1
-                            institution_data["total_num_commits"] += repo_data["has_own_commits"]
                         institution_data["sector"] = sector_key
                         institution_data["repos"].append(repo_data)
                         repo_counter += 1
diff --git a/OSS_github_benchmark.py b/OSS_github_benchmark.py
index 405a29a..6c6d670 100644
--- a/OSS_github_benchmark.py
+++ b/OSS_github_benchmark.py
@@ -55,7 +55,7 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                 institution_data["num_repos"] += g.get_organization(org).public_repos
                 institution_data["avatar"].append(g.get_organization(org).avatar_url)
                 institution_data["orgs"].append(org)
-                
+
                 # Alle Repos einer GitHub-Organisation durch-loopen
                 repo_counter = 0
                 for repo in g.get_organization(org).get_repos():
@@ -74,9 +74,9 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                             num_contributors = len(contributors)
 
                         # Überprüfen ob commits schon im parent repo existieren (ein Fork ohne eigene Commits)
-                        is_origin = 0
+                        has_own_commits = 0
                         if repo.parent:
-                            is_origin = repo.compare(repo.parent.owner.login + ":master", "master").ahead_by
+                            has_own_commits = repo.compare(repo.parent.owner.login + ":master", "master").ahead_by
 
                         # Zahlreiche Attribute eines Repos herausholen: Name, Fork (eines anderen Repos), wie oft geforkt, Contributors, Commits, Stars, Watchers und Commits der letzten 12 Monate
                         # Reference PyGitHub: https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html
@@ -88,9 +88,13 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                             "num_contributors": num_contributors,
                             "num_commits": repo.size,                # Diese Variable stimmt nicht: es wird teilweise die Anzahl Commits, teilweise auch was ganz anderes zurückgegeben
                             "num_stars": repo.stargazers_count,
-                            "num_watchers": repo.watchers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
-                            "last_years_commits": last_years_commits
-                            "is_origin": is_origin
+                            "num_watchers": repo.subscribers_count,     # Diese Variable stimmt nicht: es werden Anzahl Stars zurückgegeben
+                            "last_years_commits": last_years_commits,
+                            "has_own_commits": has_own_commits,       # Sagt aus ob eigene Commits gemacht wurden oder nur geforkt
+                            "closed_issues": repo.get_issues(state="closed").totalCount,
+                            "all_issues": repo.get_issues(state="all").totalCount,
+                            "closed_pull_requests": repo.get_pulls(state="closed").totalCount,
+                            "all_pull_requests": repo.get_pulls(state="all").totalCount
                         }
                         # Stars, Contributors, Commits, Forks, Watchers und Last Year's Commits nur zählen wenn das Repo nicht geforkt ist
                         if not repo_data["fork"]:
@@ -100,10 +104,13 @@ for sector_key, sector in githubrepos["GitHubRepos"].items():
                             institution_data["total_num_own_repo_forks"] += repo_data["num_forks"]
                             institution_data["total_num_watchers"] += repo_data["num_watchers"]
                             institution_data["total_commits_last_year"] += repo_data["last_years_commits"]
+                            institution_data["total_pull_requests"] += repo_data["all_pull_requests"]
+                            institution_data["total_issues"] += repo_data["all_issues"]
                             institution_data["repo_names"].append(repo_data["name"])
                         # Ansonsten zählen wie viele der Repos innerhalb der GitHub-Organisation geforkt sind
                         else:
                             institution_data["total_num_forks_in_repos"] += 1
+                            institution_data["total_num_commits"] += repo_data["has_own_commits"]
                         institution_data["sector"] = sector_key
                         institution_data["repos"].append(repo_data)
                         repo_counter += 1
```
