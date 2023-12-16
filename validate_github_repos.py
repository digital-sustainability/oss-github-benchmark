import json, sys


def fileError(err):
    print("File is not formatted correctly:")
    print(err)
    sys.exit(1)


repos = open("github_repos.json")
data = json.load(repos)

for item in data:
    if type(item["uuid"]) is not str or not item["uuid"]:
        fileError(item)
    if type(item["sector"]) is not str or not item["sector"]:
        fileError(item)
    if type(item["shortname"]) is not str or not item["shortname"]:
        fileError(item)
    if type(item["name_de"]) is not str or not item["name_de"]:
        fileError(item)
    orgs = item["orgs"]
    for org in orgs:
        if type(org) is not dict:
            fileError(org)
        if not org["name"]:
            fileError(org)
        if " " in org["name"]:
            fileError(org)

repos.close()
print("File ok")
