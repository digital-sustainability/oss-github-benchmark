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
}

export interface Progress {
  currentDateAndTime: number;
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
