
# Generate data

__dependencies: `docker`__

```
docker build -t oss-github .
docker --name oss-github-runner run --rm oss-github
docker rm oss-github-runner
docker rmi oss-github
```

# Start Visualization

__dependencies: `node`__

```
npm install
npm start
```

# Roadmap

- [x] show repository list
- [x] add selection of dimensions
- [x] Achsenbeschriftung
- [x] add sunburst visualization
- [x] improved data gathering
    - [x] when fork collect number of commits different from fork
- [x] fix problems when collecting data (sometimes sector and others are missing)
- [ ] fix hover being misplaced
    

# new data

