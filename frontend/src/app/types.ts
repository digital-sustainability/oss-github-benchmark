export type Institution = {
  shortname: string;
  name_de: string;
  avatar: string;
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
  orgs: Organization[];
  num_orgs: number;
  stats: Stat[];
  repo_names: string[];
  location: string;
  sector: SectorEnum;
};

export type InstitutionSumary = {
  shortname: string;
  name_de: string;
  num_repos: number;
  num_members: number;
  total_num_forks_in_repos: number;
  avatar: string;
  sector: string;
  repo_names: string[];
  location: string;
  created_at: string;
};

export type Stat = {
  timestamp: string;
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
};

export type Organization = {
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
  created_at: string;
  location: string;
  email: string;
  repos: string[];
  repo_names: string[];
  total_licenses: {
    [key: string]: number;
  };
  timestamp: string;
};

export type Repo = {
  name: string;
  url: string;
  fork: number;
  num_forks: number;
  num_contributors: number;
  num_commits: number;
  num_stars: number;
  num_watchers: number;
  last_years_commits: number;
  has_own_commits: number;
  closed_issues: number;
  issues_all: number;
  issues_closed: number;
  pull_requests_closed: number;
  comments: number;
  commit_activities: CommitActivity[];
};

export type CommitActivity = {
  days: number[];
  total: number;
  week: number;
};

enum SectorEnum {
  IT = 'IT',
  Communities = 'Communities',
  Insurances = 'Insurances',
  Banking = 'Banking',
  Media = 'Media',
  Others = 'Others',
  Gov_Companies = 'Gov_Companies',
  Gov_Federal = 'Gov_Federal',
  Gov_Cantons = 'Gov_Cantons',
  Gov_Cities = 'Gov_Cities',
  Universities = 'Universities',
}

export const sectors = Object.keys(SectorEnum)
  .map((key) => SectorEnum[key])
  .filter((k) => !(parseInt(k) >= 0));
