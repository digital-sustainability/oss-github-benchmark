FROM node:16-alpine as backendBuild
LABEL stage=build

COPY oss-api/ ./

WORKDIR /oss-api

RUN npm install 

RUN npm run build

FROM node:16 as frontendBuild
LABEL stage=build

COPY frontend/ ./frontend/

RUN cd /frontend/

WORKDIR /frontend/

RUN npm install

RUN npm run build:prod

FROM node:16-alpine as prod

COPY --from=backendBuild dist dist

COPY --from=backendBuild node_modules/ dist/node_modules

COPY --from=frontendBuild client dist/client

COPY oss-api/src/data-gathering/OSS_github_benchmark.py src/data-gathering/OSS_github_benchmark.py

ENV PYTHONUNBUFFERED 1
COPY oss-api/requirements.txt .
RUN apk add --no-cache py3-pip
RUN pip install -r requirements.txt

ENV PORT=5000

ENV NODE_ENV=PRODUCTION

CMD ["node", "dist/main.js"]
