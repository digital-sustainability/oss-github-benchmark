# How to Contribute to the OSS-Benchmark project

Contributing to this very project is very easy. If you want to add or change an new institution you will need to edit the [github_repos.json](/github_repos.json) file.

The institution blocks look like this:

```json
{
  "uuid": "<generated v4 uuid>",
  "sector": "<sector where this institution belongs to>",
  "ts": null,
  "shortname": "<the short name of the institution>",
  "name_de": "<the german name of the institution>",
  "orgs": [
    { "name": "<name of the github orga of this institution>", "ts": null },
    {
      "name": "<name of the other github orga(s) of this institution>",
      "ts": null
    }
  ]
}
```

**Generate V4 UUID:** https://www.uuidgenerator.net/version4

**Important:** oid as seen in [github_repos.json](/github_repos.json) will be created automaticly when updating the Database, so it doesn't need to be added by you.

**Important:**
sector needs to be one of these:
- FoodBeverage
- Gov_Companies
- Gov_Federal
- IT
- Communities
- Gov_Cities
- Gov_Cantons
- Media
- NGOs
- ResearchAndEducation
- Banking
- Others
- Insurances
- Pharma
- PolitcalParties

**Important** The name of the GitHub org needs to match the org URL and can't contain any spaces.

Just edit or append a new block to the file and make a pull request.

If everything is correct it will be added and updated on the website.

### What are ts and why are they set to null

ts are timestamps that are used to check when that organization/institution were crawled.

"null" is the intial value so that the new organization/institution will be crawled with the next crawl run.

After that it will be overwritte in the database.