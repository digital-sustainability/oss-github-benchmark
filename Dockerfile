ARG GITHUBTOKEN
FROM python:3 as data
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY requirements*.txt /app/
RUN pip install -r requirements.txt
COPY github_repos.json /app/
COPY OSS_github_benchmark.py /app/
RUN GITHUBTOKEN=${GITHUBTOKEN} python /app/OSS_github_benchmark.py

FROM node:lts as frontend
WORKDIR /app
COPY package*.json ./
RUN npm install && \
    npm run build

FROM nginx:alpine
COPY --from=frontend /app/dist/* /usr/share/nginx/html
COPY --from=data /app/oss-github-benchmark.* /usr/share/nginx/html
