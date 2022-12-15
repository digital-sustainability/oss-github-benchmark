import { ObjectId } from "mongodb";
import { OrgData, Stats } from "src/data-types";

export default class institution {
    constructor(
        public _id: ObjectId,
        public uuid: string,
        public shortname: string,
        public name_de: string,
        public num_repos: number,
        public num_members: number,
        public total_num_contributors: number,
        public total_num_own_repo_forks: number,
        public total_num_forks_in_repos: number,
        public total_num_commits: number,
        public total_pull_requests: number, 
        public total_issues: number,
        public total_num_stars: number,
        public total_num_watchers: number,
        public total_pull_requests_all: number,
        public total_pull_requests_closed: number,
        public total_issues_all: number,
        public total_issues_closed: number,
        public total_comments: number,
        public org_names: string[],
        public orgs: OrgData[],
        public num_orgs: number,
        public avatar: string[],
        public repos: string[],
        public repo_names: string[],
        public total_licenses: Object,
        public timestamp: Date,
        public sector: string,
        public stats: Stats[],){}
}