import { ObjectId } from "mongodb";

export interface CrawlerConfig {
  name: string,
  value: CrawlerSector[];
}

export interface CrawlerSector {
  name_de: string;
  institutions: CrawlerInstitution[];
}

export interface CrawlerInstitution {
  uuid: string;
  shortname: string;
  name_de: string;
  orgs: string[];
}

export interface CrawlerUsersNew {
  _id: ObjectId;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  blog: string;
  company: string;
  email: string;
  twitter_username: string;
  created_at: Date;
  updated_at: Date;
  contributions: any[];
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  orgs: string[];
}

export interface CrawlerOrg {
  status: number,
  url: string,
  headers: any[],
  data: CrawlerOrgData,
}

export interface CrawlerOrgData{
  login: string,
  id: number,
  node_id: string,
  url: string,
  repos_url: string,
  events_url: string,
  hooks_url: string,
  issues_url: string,
  members_url: string,
  public_members_url: string,
  avatar_url: string,
  description: string,
  name: string,
  company: object,
  blog: string,
  location: string,
  email: string,
  twitter_username: object,
  is_verified: boolean,
  has_organization_projects: boolean,
  has_repository_projects: boolean,
  public_repos: number,
  public_gists: number,
  followers: number,
  following: number,
  html_url: string,
  created_at: Date,
  updated_at: Date,
  type: string
}


export interface CrawlerOrgRepository {
  status: number,
  url: string,
  headers: any[],
  data: RepositoryInfo[],
}

export interface RepositoryInfo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: CrawlerOrgData;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: Date;
  updated_at: Date;
  pushed_at: Date;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: object;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[],
  visibility: string;
  forks: number
  open_issues: number;
  watchers: number;
  default_branch: string
  permissions: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  }
}

export interface OrgData{
  name: string;
  url: string;
  description: string;
  num_members: number;
  num_repos: number;
  avatar: string;
  created_at: Date;
  location: string;
  email: string;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
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
  repos: string[];
  repo_names: string[];
  total_licenses: object;
}



export interface PythonInstitution {
  uuid: string;
  shortname: string;
  name_de: string;
  org_names: any[];
  orgs: any[];
  num_orgs: number;
  avatar: any[];
  repos: any[];
  repo_names: any[];
  total_licenses: any;
  timestamp: Date;
  num_repos: any;
  num_members: any;
  total_num_contributors: any;
  total_num_own_repo_forks: any;
  total_num_forks_in_repos: any;
  total_num_commits: any;
  total_pull_requests: any;
  total_issues: any;
  total_num_stars: any;
  total_num_watchers: any;
  total_pull_requests_all: any;
  total_pull_requests_closed: any;
  total_issues_all: any;
  total_issues_closed: any;
  total_comments: any;
  stats: PythonInstitutionStats[];
}

export interface PythonInstitutionStats {
  timestamp: Date;
  num_repos: number;
  num_members: number;
  total_num_contributors: any;
  total_num_own_repo_forks: any;
  total_num_forks_in_repos: any;
  total_num_commits: any;
  total_pull_requests: any;
  total_issues: any;
  total_num_stars: any;
  total_num_watchers: any;
  total_pull_requests_all: any;
  total_pull_requests_closed: any;
  total_issues_all: any;
  total_issues_closed: any;
  total_comments: any;
}

export interface PythonRepositories {
  name: 'cloud-native-spa';
  uuid: '210df24f-6c14-4e8c-aff9-b65e11b3ecdb';
  url: 'https://github.com/3AP-AG/cloud-native-spa';
  institution: '3ap';
  organization: '3AP-AG';
  description: string;
  fork: false;
  archived: false;
  num_forks: 0;
  num_contributors: 1;
  num_commits: 4;
  num_stars: 0;
  num_watchers: 3;
  commit_activities: any[];
  has_own_commits: any;
  issues_closed: 0;
  issues_all: 0;
  pull_requests_closed: 0;
  pull_requests_all: 0;
  comments: 0;
  languages: any[];
  timestamp: Date;
  createdTimestamp: 0;
  updatedTimestamp: 0;
  logo: any;
  contributors: any[];
  coders: any[];
  license: any;
}
