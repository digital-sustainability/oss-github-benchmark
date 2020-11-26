
# Generate data

## using `docker`

__dependencies: `docker` or `python`__

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

__dependencies: `node`__

```
cd frontend
npm install
npm start
```

# Explore the data with jupyter notebook

There is a jupyter notebook that loads a [pickle](https://docs.python.org/3/library/pickle.html)-file of the data.
It's located at `./data-gathering/github-data.pickle`

