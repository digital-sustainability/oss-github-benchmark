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

# Run Frontend

**dependencies: `node`**

```
cd frontend
npm install
npm start
```

# Run Backend

**dependencies: `node`**

```
cd oss-api
npm install
npm start
```

# Deployment

git subtree push --prefix data-gathering prod master

# API endpoints, request- and response types

Relevant type aliases: ./frontend/src/app/types.ts

## api/singleInstitution

Find a single institution by it's unique shortname property.

### Request

#### name: string

short_name of institution.

### Response

Institution

## api/paginatedInstitutions

Get summaries of multiple institutions.

### Request

#### search?: string;

A search term.

#### sort?: string;

The column by which to sort the institutions.

#### direction?: 'ASC' | 'DESC';

#### page?: string;

Page index.

#### count?: string;

Limit for institutions returned.

#### includeForks?: string;

If forked repos should be included in repo count and sorting.

#### sector?: string[];

Only include institutions in these sectors.

### Response

#### institutions: InstitutionSummary[];

#### total: number;

The number of institutions after filtering and searching but without pagination.

#### sectors: { [key: string]: number };

How many institutions with a given sector exist. Count after searching, but before filtering.

## api/latestUpdate

get timestamp of latest update

### Request

no params

### Response

#### updatedDate: string

## api/paginatedRepositories

Get paginated list of repositories.

### Request

For more information look at api/paginatedInstitutions.

#### search?: string;

#### sort?: string;

#### direction?: 'ASC' | 'DESC';

#### page?: string;

#### count?: string;

#### includeForks?: string;

### Response

#### repositories: Repository[];

#### total: number;
