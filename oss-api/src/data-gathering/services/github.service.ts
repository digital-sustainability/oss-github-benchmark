import { CrawlerOrg, CrawlerOrgRepository } from "src/data-types";

const { Octokit } = require("@octokit/rest");

let octokit;

export const connectToGithub = async () =>{
    octokit = new Octokit({auth: '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'});
}

/**
 * Get an Organisation from Github
 * @param orgName The name of the organisation
 * @returns NULL or a CrawlerOrg object with all organisation Info
 */
export const getOragnisation = async (orgName: string) => {
    // Request org data from github
    let res = await octokit.request(`GET /orgs/${orgName}`, {org: 'ORG'}) as CrawlerOrg;
    // If response Object is null or undefined return null
    if(!res || res == undefined){
        return null;
    }
    // If response status is not 200 return null
    if(res.status != 200){
        return null;
    }
    // If all is ok return the object
    return res;
}

/**
 * Get the number of members in a organisation
 * @param orgName The name of the organisation
 * @returns NULL or a CrawlerOrg object with all the member data
 */
export const getMembers = async (orgName: string) => {
    // Request member data from github
    let res = await octokit.request(`GET /orgs/${orgName}/members`, { org: 'ORG'}) as CrawlerOrg
    // If response is null or undefined, return null
    if(!res || res == undefined){
        return null;
    }
    // If status is not 200, return 0
    if(res.status != 200){
        return null;
    }
    // Else return the response
    return res;
}

/**
 * Get a list with all the repos and their information corresponfing to an org
 * @param orgName The name of the organisation
 * @returns NULL or a CrawlerOrgRepository object with the repository list
 */
export const getOrgRepositoryList = async (orgName: string) => {
    // Request repository list from github
    let res = await octokit.request(`GET /orgs/${orgName}/repos`, {org: 'ORG'}) as CrawlerOrgRepository
    // If response is null or undefined, return null;
    if(!res || res == undefined){
        return null;
    }
    // If response is not 200 return 0
    if(res.status != 200){
        return null;
    }
    // Else return the response object
    return res;
}

/**
 * Get all the contributors of a repository
 * @param ownerName The name of the owner of the repository
 * @param repoName The name of the repository
 * @returns NULL or a CrawlerOrg Object with the contributors list
 */
export const getRepositoryContributors = async (ownerName: string, repoName: string) => {
    // Get all the contributors from a git repository
    let res = await octokit.request(`GET /repos/${ownerName}/${repoName}/contributors`, {owner: 'OWNER',repo: 'REPO'}) as CrawlerOrg
    // If reponse is null or undefined return null
    if(!res || res == undefined){
        return null;
    }
    // If response status is not 200 return
    if(res.status != 200){
        return null;
    }
    // Else return the response object
    return res;
}