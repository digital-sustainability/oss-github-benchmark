
# A help function from https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.DEFAULT_GOAL := help

.PHONY: help
help:
		@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


run: 		## Run this to create the json data
		docker build -t oss-github .
		# docker run --rm -e GITHUBTOKEN=${GITHUBTOKEN} -v $(pwd):/app --name oss-github-runner oss-github
		docker run -e GITHUBTOKEN=$(GITHUBTOKEN) -v $(pwd):/app --name oss-github-runner oss-github
		#docker rm oss-github-runner
		#docker rmi oss-github

explore: 	## This is used to start the jupyter notebook
		docker build -t oss-github-jupyter -f docker/Dockerfile.jupyter .
		docker run -p 8888:8888 -v $(pwd)/docs/notebooks/:/home/jovyan/work --name oss-github-jupyter-runner oss-github-jupyter
