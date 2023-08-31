# How to Contribute to the OSS-Benchmark project

Contributing to this very project is very easy. If you want to add or change an new institution you will need to edit the [github_repos.json](/github_repos.json) file.

The institution blocks look like this:

```json
{
  "uuid": "<generated v4 uuid>",
  "sector": "<sector where this institution belongs to>",
  "ts": null,
  "shortname": "<the short name of the institution>",
  "name_de": "<the german name of the instution>",
  "orgs": [
    { "name": "<name of the github orga of this instituion>", "ts": null },
    {
      "name": "<name of the other github orga(s) of this instituion>",
      "ts": null
    }
  ]
}
```

Just edit or append a new block to the file and make a pull request.

If everything is correct it will be added and updated on the website.
