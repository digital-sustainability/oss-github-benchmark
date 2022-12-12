import { CrawlerConfig, CrawlerInstitution } from "src/data-types";
import todoInstitution from "./models/todoInstitution";
import { connectToDatabase, dbCollections, db_getTodoInstitutions } from "./services/database.service";
import { connectToGithub } from "./services/github.service";

/**
 * Initate the MongoDB and Github instances
 */
const coordinator = async () => {
    // Connect to database
    await connectToDatabase();
    // Connect to Github
    //await connectToGithub();

    //Get all the Institutions
    let todoInstitutions = await db_getTodoInstitutions();
    //Get the industry arrays
    let todoInstitution = todoInstitutions[0];
    //Get each institution from each industry and push it into the list
    let institutionList: CrawlerInstitution[];
    /*todoInstitution.githubrepos.forEach(industry => {
        industry[1].institutions.forEach(institution => {
            institutionList.push(institution);
        });
    });*/
    // If list is undefined or empty, return error
    if(institutionList == undefined || institutionList){
        console.error("Did not find any institutions to crawl. Returning");
        return -1;
    }

    console.log(institutionList);
    
}

coordinator();


export default coordinator;