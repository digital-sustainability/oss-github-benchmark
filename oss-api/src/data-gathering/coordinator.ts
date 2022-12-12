import { CrawlerConfig, CrawlerInstitution, CrawlerOrg, OrgData } from "src/data-types";
import todoInstitution from "./models/todoInstitution";
import { connectToDatabase, dbCollections, db_readTodoInstitutions, db_removeAllNewUsers, db_writeRawResponse } from "./services/database.service";
import { connectToGithub, getMembers, getOragnisation } from "./services/github.service";

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
            let org = await getOragnisation(orgName)
            // Write raw response to database
            await db_writeRawResponse(org as string, "get_org");
            // Cast to CrawlerOrg type
            let typeOrg = org as CrawlerOrg;
            // Get the OrgData into form
            let orgData: OrgData = {  
                name: typeOrg.data.name,
                url: typeOrg.data.url,
                description: typeOrg.data.description,
                num_members: await getMembers(orgName),
                num_repos: typeOrg.data.public_repos,
                avatar: typeOrg.data.avatar_url,
                created_at: typeOrg.data.created_at,
                location: typeOrg.data.location,
                email: typeOrg.data.email,
                repos: [],
                repo_names: [],
                total_licenses: {}}

                // py line 324

                
            
            
            //Write raw res to db
        }
    }
}

coordinator();


export default coordinator;