# How to setup the dev enviroment

## Backend

**Pre-requirements:** NestJS, npm

### Env Variables

These are the env variables that need to be set-up:
- MONGO_READ: The connection string. Can be found in Keepass
- MONGO_DATABASE: Which database to use. production or testingNew
- GITHUB_TOKEN: The Github token. Can be found in Keepass
- LOG_PATH: The path for the log files to be saved in. Somewhere on your system.
- DATA_PATH: The path for the data files to be saved in. Somewhere on your system.

### Run Backend

> - From root cd into */oss-api*</br>
> - Run **npm i** to install all the necessary packages
> - Finally you can start the dev server with **npm run start:dev**

## Frontend

**Pre-requirements:** AngularJS, npm, finished backend setup

> - From root cd into */frontend*</br>
> - Run **npm i** to install all the necessary packages</br>
> - Finally you can start the dev server with **npm run start**


# Update Institutions

Once someone has updated the github_repos.json file and the pull request was merged, the new or updated insitution must be added to the database.

This can be done in 4 easy steps:

1. Pull Repository
2. Enter the connection string, which can be found in Keepass, into the URI field of MongoCompass.
3. Check if the new repository details are valid: the organisation shortname has to match the name in the url of the GitHub page.

![MongoCompass Connection string](/assets/images/MongoConnection.png)

4. Choose the **production** DB and then todoInstitution collection.

![Mongo choose DB](/assets/images/MongoDB.png)

5. Press **Add Data -> Import file** and choose github_repos.json. Keep in mind that *Stop on errors* needs to be unchecked. Then just click *Import*. Note that Institutions with an ID already present in the DB are not imported/updated in the DB.

![Add new Data to DB](/assets/images/AddData.png)