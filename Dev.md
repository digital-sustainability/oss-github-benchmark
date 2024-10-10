# How to setup the dev enviroment

## Backend

**Pre-requirements:** NestJS, npm

### Env Variables

These are the env variables that need to be set-up:
- MONGO_READ: The connection string. Can be found in Keepass
- MONGO_DATABASE: Which database to use. testingNew for development, production for the productive website
- GITHUB_TOKEN: The Github token. Token used for the productive Website can be found in Keepass. Please create your own token from your gitHub Account for local use.
- LOG_PATH: The path for the log files to be saved in. Somewhere on your system.
- DATA_PATH: The path for the data files to be saved in. Somewhere on your system.

### Connection to the Database

To connect to the database on the server you can:
1. Set up a ssh Tunneling/ Local port forwarding:
```
ssh dev1 -L <local machine IP>:<destination e.g 9898>:<server IP>:27017
```

If you want to change the Data in the mongoDB, you can Install mongoDB Compass. It has a nice, partly intuitive interface for simple changes in the Data.
1. Install mongoDB Compass (https://www.mongodb.com/docs/compass/current/install/)
2. In mongoDB Compass: add a new connection
3. Use the connection string (MONGO_DATABASE) to connect to the dev server database. Make sure the destination number (e.g. 9898) in the connection string is the same as in the command you used for the tunneling.

### Run Backend

> - From root cd into */oss-api*</br>
> - Run **npm i** to install all the necessary packages
> - Finally you can start the dev server with **npm run start:dev**

## Frontend

**Pre-requirements:** AngularJS, npm, finished backend setup

> - From root cd into */frontend*</br>
> - Run **npm i** to install all the necessary packages</br>
> - Finally you can start the dev server with **npm run start**

# Update Institutions using add-Institution Mask

Use the Login Details from KeePass to access the add-Institution-View (Internal use only so far). It allows you to add new Institutions to the TodoInstitution Collection and thus put them into the cue of Institutions which are Crawled. Please read the Instructions in the Userinterface also.

### What are ts and why are they set to null

ts are timestamps that are used to check when that organization/institution were crawled.

"null" is the intial value so that the new organization/institution will be crawled with the next crawl run.

After that it will be overwritte in the database.

# Update Institutions using the github_repos.md

Once someone has updated the github_repos.json file and the pull request was merged, the new or updated insitution must be added to the database.

This can be done in 4 easy steps:

1. Open the productive Website (or local, Choose the **production** DB and then todoInstitution collection.)
2. Login. The Credentials can be found in Keepass.
3. Click **Add/Edit an Institution**.
4. Check if the new repository details in "github_repos.md" are valid: the organisation shortname has to match the name in the url of the GitHub page.
5. Add the new Organisation or Edit if nessecary (You can reset the timestamp to cue the institution for crawling).

