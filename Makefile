
# A help function from https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.DEFAULT_GOAL := help
.PHONY: help
help:           ##- Show this help.
	@sed -e '/#\{2\}-/!d; s/\\$$//; s/:[^#\t]*/:/; s/#\{2\}- *//' $(MAKEFILE_LIST)

run:
	docker build -t oss-github .
	docker --name oss-github-runner run --rm oss-github
	docker rm oss-github-runner
	docker rmi oss-github
