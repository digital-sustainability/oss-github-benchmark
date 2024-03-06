FROM node:20.6.0-alpine3.17 as backendBuild
LABEL stage=build
ENV NODE_ENV=PRODUCTION

COPY oss-api/ ./

WORKDIR /oss-api

RUN npm install 

RUN npm run build

FROM node:20.6.0-alpine3.17 as frontendBuild
LABEL stage=build
ENV NODE_ENV=PRODUCTION

COPY frontend/ ./frontend/

RUN cd /frontend/

WORKDIR /frontend/

RUN npm install 

RUN npm run build:prod

FROM node:20.6.0-alpine3.17 as prod

COPY --from=backendBuild dist dist

COPY --from=backendBuild node_modules/ dist/node_modules

COPY --from=frontendBuild client client

ENV PORT=5000

ENV NODE_ENV=PRODUCTION

EXPOSE 5000/tcp 9464/tcp

CMD ["node", "dist/main.js"]
