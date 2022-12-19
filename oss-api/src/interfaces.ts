export interface GithubResponse {
  status: number;
  url: string;
  headers: any[];
  data: object | CommitActivity[];
}

export interface CommitActivity {
  total: number;
  week: number;
  days: number[];
}
export interface GithubResponseLanguages {
  status: number;
  url: string;
  headers: any[];
  data: Languages;
}

export interface GithubResponseCommits {
  status: number;
  url: string;
  headers: any[];
  data: Commit[];
}

export interface Commit {
  url: string;
  sha: string;
  node_id: string;
  html_url: string;
  comments_url: string;
  commit: object;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  committer: object;
  parents: object;
}

export interface Statistic {
  timestamp: Date;
  num_repos: number;
  num_members: number;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
  total_num_forks_in_repos: number;
  total_num_commits: number;
  total_pull_requests: number;
  total_issues: number;
  total_num_stars: number;
  total_num_watchers: number;
  total_commits_last_year: number;
  total_pull_requests_all: number;
  total_pull_requests_closed: number;
  total_issues_all: number;
  total_issues_closed: number;
  total_comments: number;
}

export interface Organization {
  num_repos: number;
  num_members: number;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
  total_num_forks_in_repos: number;
  total_num_commits: number;
  total_pull_requests: number;
  total_issues: number;
  total_num_stars: number;
  total_num_watchers: number;
  total_pull_requests_all: number;
  total_pull_requests_closed: number;
  total_issues_all: number;
  total_issues_closed: number;
  total_comments: number;
  name: string;
  url: string;
  description: string;
  avatar: string;
  created_at: Date;
  location: string;
  email: string;
  repos: string[];
  repo_names: string[];
  total_licenses: Licenses;
}

export interface Institution {
  uuid: string;
  shortname: string;
  name_de: string;
  num_repos: number;
  num_members: number;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
  total_num_forks_in_repos: number;
  total_num_commits: number;
  total_pull_requests: number;
  total_issues: number;
  total_num_stars: number;
  total_num_watchers: number;
  total_pull_requests_all: number;
  total_pull_requests_closed: number;
  total_issues_all: number;
  total_issues_closed: number;
  total_comments: number;
  org_names: string[];
  orgs: Organization[];
  num_orgs: number;
  avatar: string[];
  repos: string[];
  repo_names: string[];
  total_licenses: Licenses;
  timestamp: Date;
  sector: string;
  stats?: Statistic[];
  searchString?: string;
}

export interface Repository {
  name: string;
  uuid: string;
  url: string;
  institution: string;
  organization: string;
  description: string;
  fork: boolean;
  archived: boolean;
  num_forks: number;
  num_contributors: number;
  num_commits: number;
  num_stars: number;
  num_watchers: number;
  has_own_commits: number;
  issues_closed: number;
  issues_all: number;
  pull_requests_closed: number;
  pull_requests_all: number;
  comments: number;
  languages: Languages;
  timestamp: Date;
  createdTimestamp: Date;
  updatedTimestamp: Date;
  contributors: string[];
  coders: string[];
  license: string;
  logo?: string;
}

export interface RepositoryNew {
  name: string;
  uuid: string;
  url: string;
  institution: string;
  organization: string;
  description: string;
  fork: boolean;
  archived: boolean;
  num_forks: number;
  num_contributors: number;
  num_commits: number;
  num_stars: number;
  num_watchers: number;
  commit_activities: CommitActivity[];
  has_own_commits: number;
  issues_closed: number;
  issues_all: number;
  pull_requests_closed: number;
  pull_requests_all: number;
  comments: number;
  languages: Languages;
  timestamp: Date;
  createdTimestamp: Date;
  updatedTimestamp: Date;
  contributors: string[];
  coders: string[];
  license: string;
  logo?: string;
}

export interface User {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  blog: string;
  company: string;
  email: string | null;
  twitter_username: string | null;
  location: string;
  created_at: Date;
  updated_at: Date;
  contributions: Contributions;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  orgs: string[];
}

export interface Contributions {
  [key: string]: OrganisationContributions;
}

export interface OrganisationContributions {
  [key: string]: RepositoryContributions;
}

export interface RepositoryContributions {
  [key: string]: number;
}

export interface Licenses {
  [key: string]: number;
}

export interface Languages {
  [key: string]: number;
}

export interface Status {
  currentSectorNO: number;
  currentInstitutionNO: number;
  currentInstitutionName: string;
  running: boolean;
  progress: number;
  lastUpdated: Date;
}

export interface Progress {
  currentSector: number;
  currentInstitution: number;
}

export interface InstitutionQueryConfig {
  sector: string[];
  search?: string;
  sort: string;
  direction: 'ASC' | 'DESC';
  page: number;
  count: number;
  sendStats: boolean;
  includeForksInSort: boolean;
  findName: string;
}

export interface UserQueryConfig {
  search?: string;
  sort: string;
  direction: 'ASC' | 'DESC';
  page: number;
  count: number;
}

export interface RepositoryQueryConfig {
  search?: string;
  sort: string;
  direction: 'ASC' | 'DESC';
  page: number;
  count: number;
  includeForks: boolean;
}
