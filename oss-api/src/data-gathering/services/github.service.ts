import { CrawlerOrg } from "src/data-types";

const { Octokit } = require("@octokit/rest");

let octokit;

export const connectToGithub = async () =>{
    octokit = new Octokit();
}

/**
 * Get an Organisation from Github
 * @param orgName The name of the organisation
 * @returns an CrawlerOrg object with all organisation Info
 */
export const getOragnisation = async (orgName: string) => {
    return await octokit.request(`GET /orgs/${orgName}`, {org: 'ORG'})
    
}

/**
 * Get the number of members in a organisation
 * @param orgName The name of the organisation
 * @returns the number of the members, 0 if undefined
 */
export const getMembers = async (orgName: string) => {
    let res = await octokit.request(`GET /orgs/${orgName}/members`, { org: 'ORG'}) as object
    const status = res["status"];

    if(status != 200 || !res || res == undefined){
        return 0;
    }


    return Object.keys(res["data"]).length
}