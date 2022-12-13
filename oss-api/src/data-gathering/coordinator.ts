import { CrawlerConfig, CrawlerInstitution, CrawlerOrg, OrgData } from "src/data-types";
import todoInstitution from "./models/todoInstitution";
import { connectToDatabase, dbCollections, db_readTodoInstitutions, db_removeAllNewUsers, db_writeRawResponse } from "./services/database.service";
import { connectToGithub, getMembers, getOragnisation, getOrgRepositoryList, getRepositoryContributors } from "./services/github.service";

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
    let institutionList: CrawlerInstitution[] = [];
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

    for (const institution of testData) {
        for (const orgName of institution.orgs) {
            // Get all organisation Data from Github
            let org = await getOragnisation(orgName)
            // If organisation is null, skip it
            if(!org || org == undefined){
                continue;
            }
            // Write the reponse Object to the Database
            await db_writeRawResponse(org, "get_org");
            // Get the number of members in the organisation
            let members = await getMembers(orgName);
            // If members is null or undefined, skip the organisation
            if(!members || members == undefined){
                continue;
            }
            // Write the response Object to the Database
            await db_writeRawResponse(members, "get_members");
            // Get the member count
            let memberCount = Object.keys(members.data).length;
            // Get the list of all repositories corresponding to the org
            let repoList = await getOrgRepositoryList(orgName);
            // If the list is null or undefined, skip this org
            if(!repoList || repoList == undefined){
                continue;
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
                total_comments: 0};
            // For all repos
            for (const repo of repoList.data) {      
                // Get all the contributors of the repository          
                let contributors = await getRepositoryContributors(repo.owner.login, repo.name);
                // If the contributors are null or undefined return;
                if(!contributors || contributors == undefined){
                    continue;
                }

                // Add repo information to the orgData
                /*orgData.total_num_stars += repo.stargazers_count;
                orgData.total_num_contributors += repo.*/
                
            }
        }
    }
}

coordinator();


export default coordinator;