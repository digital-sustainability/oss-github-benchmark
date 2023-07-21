FROM node:18 as backendBuild
LABEL stage=build
ENV NODE_ENV=PRODUCTION

COPY oss-api/ ./

WORKDIR /oss-api

RUN npm install 

RUN npm run build

FROM node:18 as frontendBuild
LABEL stage=build
ENV NODE_ENV=PRODUCTION

COPY frontend/ ./frontend/

RUN cd /frontend/

WORKDIR /frontend/

RUN npm install 

RUN npm run build:prod

FROM node:18 as prod

COPY --from=backendBuild dist dist

COPY --from=backendBuild node_modules/ dist/node_modules

COPY --from=frontendBuild client client

ENV PORT=5000

ENV NODE_ENV=PRODUCTION

CMD ["node", "dist/main.js"]
