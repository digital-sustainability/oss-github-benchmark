import { CrawlerConfig, CrawlerTodoInstitution, CrawlerOrg, OrgData, Institution, RepositoryInfo } from "src/data-types";
import todoInstitution from "./models/todoInstitution";
import { connectToDatabase, dbCollections, db_readTodoInstitutions, db_removeAllNewUsers, db_writeRawResponse } from "./services/database.service";
import { git_compareTwoCommits, connectToGithub, git_getComments, git_getIssues, git_getMembers, git_getOragnisation, git_getOrgRepositoryList, git_getPullRequests, git_getRepoCommits, git_getRepositoryContributors } from "./services/github.service";

/**
 * Initate the MongoDB and Github instances
 */
const coordinator = async () => {
    // Connect to database
    await connectToDatabase();
    // Connect to Github
    await connectToGithub();
    //Get all the Institutions
    let todoInstitutions = await db_readTodoInstitutions();
    //Get the industry arrays
    let todoInstitution = todoInstitutions[0];
    //Get each institution from each industry and push it into the list
    let institutionList: CrawlerTodoInstitution[] = [];
    todoInstitution.githubrepos.forEach(industry => {
        industry[1].institutions.forEach(institution => {
            institutionList.push(institution);
        });
    });    
    // If list is undefined or empty, return error
    if(institutionList == undefined || !institutionList || institutionList.length == 0){
        console.error("Did not find any institutions to crawl. Returning");
        return -1;
    }
    // Clean all users from the database (newusers collection)
    //await db_removeAllNewUsers();
    // Get all orgs from an institution from github
    let testData = [institutionList[0], institutionList[1]]
    // For each instution
    for (const todoInstitution of testData) {
        let institution: Institution = {
            uuid: todoInstitution.uuid,
            shortname: todoInstitution.shortname,
            name_de: todoInstitution.name_de,
            num_repos: 0,
            num_members: 0,
            total_num_contributors: 0,
            total_num_own_repo_forks: 0,
            total_num_forks_in_repos: 0,
            total_num_commits: 0,
            total_pull_requests: 0,
            total_issues: 0,
            total_num_stars: 0,
            total_num_watchers: 0,
            total_pull_requests_all: 0,
            total_pull_requests_closed: 0,
            total_issues_all: 0,
            total_issues_closed: 0,
            total_comments: 0,
            org_names: [],
            orgs: [],
            num_orgs: 0,
            avatar: [],
            repos: [],
            repo_names: [],
            total_licenses: {},
            timestamp: new Date(),
            sector: "",
            stats: [],
        }
        for (const orgName of todoInstitution.orgs) {
            // Get the organisation object
            let org = await getOrganisation(orgName);
            // If the response is null or undefined, skip this organisation
            if(!org || org == undefined){
                continue;
            }
            // Update institution Data
            institution.orgs.push(org);
            institution.num_orgs += 1;
            institution.num_members += org.num_members;
            institution.num_repos += org.num_repos;
            institution.avatar.push(org.avatar);
            institution.org_names.push(orgName);
            institution.sector = ""; // TODO - need to get sector key, maybe put it directy in line 22??
            institution.total_num_stars += org.total_num_stars;
            institution.total_num_contributors += org.total_num_contributors;
            institution.total_num_commits += org.total_num_commits;
            institution.total_num_own_repo_forks += org.total_num_own_repo_forks;
            institution.total_num_watchers += org.total_num_watchers;
            institution.total_pull_requests_all += org.total_pull_requests_all;
            institution.total_pull_requests_closed += org.total_pull_requests_closed;
            institution.total_issues_all += org.total_issues_all;
            institution.total_issues_closed += org.total_issues_closed;
            institution.total_comments += org.total_comments;
            institution.repos.concat(org.repos);
            institution.repo_names.concat(org.repo_names);
        }

        // TODO - python line 409
    }
}

const getOrganisation = async(orgName: string) => {
    // Get all organisation Data from Github
    let org = await git_getOragnisation(orgName)
    // If organisation is null, skip it
    if(!org || org == undefined){
        return null;
    }
    // Write the reponse Object to the Database
    await db_writeRawResponse(org, "get_org");
    // Get the number of members in the organisation
    let members = await git_getMembers(orgName);
    // If members is null or undefined, skip the organisation
    if(!members || members == undefined){
        return null;
    }
    // Write the response Object to the Database
    await db_writeRawResponse(members, "get_members");
    // Get the member count
    let memberCount = Object.keys(members.data).length;
    // Get the list of all repositories corresponding to the org
    let repoList = await git_getOrgRepositoryList(orgName);
    // If the list is null or undefined, skip this org
    if(!repoList || repoList == undefined){
        return null;
    }
    // Write the response object to the database
    await db_writeRawResponse(repoList, "get_repo_list");
    // Get the OrgData into form
    let orgData: OrgData = {  
        name: org.data.name,
        url: org.data.url,
        description: org.data.description,
        num_members: memberCount,
        num_repos: org.data.public_repos,
        avatar: org.data.avatar_url,
        created_at: org.data.created_at,
        location: org.data.location,
        email: org.data.email,
        repos: [],
        repo_names: [],
        total_licenses: {},
        total_num_contributors: 0,
        total_num_own_repo_forks: 0,
        total_num_commits: 0,
        total_pull_requests: 0,
        total_issues: 0,
        total_num_stars: 0,
        total_num_watchers: 0,
        total_pull_requests_all: 0,
        total_pull_requests_closed: 0,
        total_issues_all: 0,
        total_issues_closed: 0,
        total_num_forks_in_repos: 0,
        total_comments: 0};
    // For all repos
    for (const repo of repoList.data) {      
        orgData = await getRepository(repo, orgData);
    }
    return orgData;
}

const getRepository = async (repo: RepositoryInfo, orgData: OrgData) => {
    // If this repository is a fork, skip it
    if(repo.fork){
        // Get the difference between master and master. That will show if they made own commits to the fork or not.
        let commits = await git_compareTwoCommits(repo.owner.login, repo.name);
        // If the contributors are null or undefined skip this repo
        if(!commits || commits == undefined){
            return;
        }
        // Write the response to the database
        await db_writeRawResponse(commits, "get_repo_commits");
        // Update the organisation data
        orgData.total_num_forks_in_repos += 1;
        orgData.total_num_commits = commits.data["ahead_by"]
        orgData.repos.push(); // TODO - check if still is being used
        orgData.repo_names.push(repo.name);
        return orgData;
    }
    // Get all the contributors of the repository          
    let contributors = await git_getRepositoryContributors(repo.owner.login, repo.name);
    // If the contributors are null or undefined skip this repo
    if(!contributors || contributors == undefined){
        return orgData;
    }
    // Write the response to the database
    await db_writeRawResponse(contributors, "get_repo_contributors");
    // Get all the commits of the repository
    let commits = await git_getRepoCommits(repo.owner.login, repo.name);
    // If commits is null or undefined skip this repo
    if(!commits || commits == undefined){
        return orgData;
    }
    // Write the response to the database
    await db_writeRawResponse(commits, "get_repo_commits");
    // Get all pull requests from repo
    let allPullRequests = await git_getPullRequests(repo.owner.login, repo.name, "all");
    // If allPullRequests is null or undefined skip this repo
    if(!allPullRequests || allPullRequests == undefined){
        return orgData;
    }
    // Write the response to the database
    await db_writeRawResponse(allPullRequests, "get_repo_pull_all");
    // Get the closed pull requests
    let closedPullRequests = await git_getPullRequests(repo.owner.login, repo.name, "closed");
    // If closedPullRequests is null or undefined skip this repo
    if(!closedPullRequests || closedPullRequests == undefined){
        return orgData;
    }
    // Get all issues from repo
    let allIssues = await git_getIssues(repo.owner.login, repo.name, "all");
    // If allPullRequests is null or undefined skip this repo
    if(!allIssues || allIssues == undefined){
        return orgData;
    }
    // Write the response to the database
    await db_writeRawResponse(allIssues, "get_repo_issues_all");
    let comments = await git_getComments(repo.owner.login, repo.name);
    // If allPullRequests is null or undefined skip this repo
    if(!comments || comments == undefined){
        return orgData;
    }
    // Write the response to the database
    await db_writeRawResponse(comments, "get_repo_commetns");
    // Add repo information to the orgData
    orgData.total_num_stars += repo.stargazers_count;
    orgData.total_num_contributors += Object.keys(contributors.data).length;
    orgData.total_num_commits += Object.keys(commits.data).length;
    orgData.total_num_own_repo_forks += repo.forks_count;
    orgData.total_num_watchers += repo.watchers_count;
    orgData.total_pull_requests_all += Object.keys(allPullRequests.data).length;
    orgData.total_pull_requests_closed += Object.keys(closedPullRequests.data).length;
    orgData.total_issues_all += Object.keys(allIssues.data).length;
    orgData.total_issues_closed += (orgData.total_issues_all - repo.open_issues_count)
    orgData.total_comments +=  Object.keys(comments.data).length;
    // Set the licence name to none
    let licenceName: string = "none";
    // If repo has a licence, set the licence name to that licence
    if(repo?.license?.name){
        licenceName = repo.license.name;
    }
    // If org has the licence, increment it. If not, add it and set it to 1
    if(licenceName in orgData.total_licenses){
        orgData.total_licenses[licenceName] += 1;
    }else{
        orgData.total_licenses[licenceName] = 1;
    }
    // Update the org Data
    orgData.repos.push(); // TODO - check if still is being used
    orgData.repo_names.push(repo.name);
    return orgData;
}

coordinator();


export default coordinator;