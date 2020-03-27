# Generate data

```
docker build -t oss-github .
docker --name oss-github-runner run --rm oss-github
docker rm oss-github-runner
docker rmi oss-github
```
