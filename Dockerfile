FROM node:18 as backendBuild
LABEL stage=build

COPY oss-api/ ./

WORKDIR /oss-api

RUN npm install && npm run build

FROM node:16 as frontendBuild
LABEL stage=build

COPY frontend/ ./frontend/

RUN cd /frontend/

WORKDIR /frontend/

RUN npm install --legacy-peer-deps && npm run build:prod

FROM node:18 as prod

COPY --from=backendBuild dist dist

COPY --from=backendBuild node_modules/ dist/node_modules

COPY --from=frontendBuild client client

ENV PORT=5000

ENV NODE_ENV=PRODUCTION

CMD ["node", "dist/main.js"]
