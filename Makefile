
# A help function from https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.DEFAULT_GOAL := help
.PHONY: help
help:           ##- Show this help.
	@sed -e '/#\{2\}-/!d; s/\\$$//; s/:[^#\t]*/:/; s/#\{2\}- *//' $(MAKEFILE_LIST)

run:
	docker build -t oss-github .
	# docker run --rm -e GITHUBTOKEN=${GITHUBTOKEN} -v $(pwd):/app --name oss-github-runner oss-github
	docker run -e GITHUBTOKEN=$(GITHUBTOKEN) -v $(pwd):/app --name oss-github-runner oss-github
	#docker rm oss-github-runner
	#docker rmi oss-github

explore:
	docker build -t oss-github-jupyter -f docker/Dockerfile.jupyter .
	docker run -p 8888:8888 -v $(pwd)/docs/notebooks/:/home/jovyan/work --name oss-github-jupyter-runner oss-github-jupyter
