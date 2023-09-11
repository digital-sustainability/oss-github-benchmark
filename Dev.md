# How to setup the dev enviroment

## Backend

**Pre-requirements:** NestJS, npm

### Env Variables

These are the env variables that need to be set-up:
- MONGO_READ: The connection string
- MONGO_DATABASE: Which database to use
- GITHUB_TOKEN: The Github token 
- LOG_PATH: The path for the log files to be saved in
- DATA_PATH: The path for the data files to be saved in

### Run Backend

> - From root cd into */oss-api*</br>
> - Run npm i to install all the necessary packages
> - Finally you can start the dec server with **npm run start:dev**

## Frontend

**Pre-requirements:** AngularJS, npm, finished backend setup

> - From root cd into */frontend*</br>
> - Run npm i to install all the necessary packages</br>
> - Finally you can start the dev server with **npm run start**