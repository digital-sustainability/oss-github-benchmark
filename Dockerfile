FROM node:16-alpine as backendBuild

COPY oss-api/ ./

WORKDIR /oss-api

RUN npm install 

RUN npm run build

FROM node:16-alpine as prod

COPY --from=backendBuild dist dist

COPY --from=backendBuild node_modules/ dist/node_modules

COPY oss-api/src/data-gathering/OSS_github_benchmark.py src/data-gathering/OSS_github_benchmark.py

ENV PYTHONUNBUFFERED 1
COPY oss-api/requirements.txt .
RUN apk add --no-cache py3-pip
RUN pip install -r requirements.txt

ENV PORT=5000

ENV NODE_ENV=PRODUCTION

CMD ["node", "dist/main.js"]
