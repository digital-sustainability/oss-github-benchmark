# Visit our website!

https://ossbenchmark.com

# Generate data

## using `docker`

**dependencies: `docker` or `python`**

```
docker build -t oss-github .
docker --name oss-github-runner run --rm oss-github
docker rm oss-github-runner
docker rmi oss-github
```

## using `python`

```
cd ./data-gathering
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python OSS_github_benchmark.py
```

# Start Visualization

**dependencies: `node`**

```
cd frontend
npm install
npm start
```

# Explore the data with jupyter notebook

There is a jupyter notebook that loads a [pickle](https://docs.python.org/3/library/pickle.html)-file of the data.
It's located at `./data-gathering/github-data.pickle`

# Deployment

git subtree push --prefix data-gathering prod master

# API endpoints, request- and response types

Relevant type aliases: ./frontend/src/app/types.ts

## api/singleInstitution

### Request

#### name: string

short_name of institution

### Response

Institution object
