export interface IInstitution {
    orgs: string[];
    num_orgs: number;
    num_repos: number;
    num_members: number;
    avatar: string[];
    repos: IRepo[];
    total_num_contributors: number;
    total_num_own_repo_forks: number;
    total_num_forks_in_repos: number;
    total_num_commits: number;
    total_num_stars: number;
    total_num_watchers: number;
    total_commits_last_year: number;
    repo_names: [];
    sector: SectorEnum;
}

export interface IRepo {
    name: string;
    fork: number;
    num_forks: number;
    num_contributors: number;
    num_commits: number;
    num_stars: number;
    num_watchers: number;
    last_years_commits: number;
    has_own_commits: number;
    closed_issues: number;
    all_issues: number;
    closed_pull_requests: number;
    all_pull_requests: number;
}

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

export const sectors = Object.keys(SectorEnum).map(key => SectorEnum[key]).filter(k => !(parseInt(k) >= 0))
