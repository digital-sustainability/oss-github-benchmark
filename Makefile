
project_name = $(shell basename $(PWD))

# A help function from https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.DEFAULT_GOAL := help

.PHONY: help
help:
		@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


.PHONY: prepare
prepare: run cp-files ## run and copy files

run: 		## Run this to create the json data
		docker build -t oss-github -f docker/Dockerfile.github-runner .
		# docker run --rm -e GITHUBTOKEN=${GITHUBTOKEN} -v $(pwd):/app --name oss-github-runner oss-github
		docker run --rm -e GITHUBTOKEN=$(GITHUBTOKEN) -v $(shell pwd):/app --name oss-github-runner oss-github
		docker rmi oss-github

explore: 	## This is used to start the jupyter notebook
		docker build -t oss-github-jupyter -f docker/Dockerfile.jupyter .
		docker run --rm -e GITHUBTOKEN=$(GITHUBTOKEN) -p 8888:8888 -v $(shell pwd)/docs/notebooks/:/home/jovyan/work --name oss-github-jupyter-runner oss-github-jupyter
		
cp-files:       ## This is to copy files
		cp ./oss-github-benchmark.csv ./assets/
		cp ./oss-github-benchmark.json ./assets/

install-deps:   ## npm install in a docker
		docker-compose -f docker/dev/docker-compose.yml -p $(project_name) run --rm app npm install

start: 		## npm start in docker
		docker-compose -f docker/dev/docker-compose.yml -p $(project_name) up -d

stop: 		## stop app in docker
		docker-compose -f docker/dev/docker-compose.yml -p $(project_name) down
