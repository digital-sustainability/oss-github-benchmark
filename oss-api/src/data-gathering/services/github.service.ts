import {
  CrawlerOrg,
  CrawlerOrgRepository,
  GitResponseBasic,
} from 'src/data-types';
import {
  GithubResponse,
  GithubResponseCommits,
  GithubResponseLanguages,
  User,
} from 'src/interfaces';

// TODO - wrapp all in try catch
// TODO - change typing from string to using the functions: https://octokit.github.io/rest.js/v19

const { Octokit } = require('@octokit/rest');

let octokit;

export const connectToGithub = async () => {
  octokit = new Octokit({ auth: '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' });
};

/**
 * Get an Organisation from Github
 * @param orgName The name of the organisation
 * @returns NULL or a CrawlerOrg object with all organisation Info
 */
export const git_getOragnisation = async (orgName: string) => {
  // Request org data from github
  let res = (await octokit.request(`GET /orgs/${orgName}`, {
    org: 'ORG',
  })) as CrawlerOrg;
  // If response Object is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200 return null
  if (res.status != 200) {
    return null;
  }
  // If all is ok return the object
  return res;
};

/**
 * Get the number of members in a organisation
 * @param orgName The name of the organisation
 * @returns NULL or a GitResponseBasic object with all the member data
 */
export const git_getMembers = async (orgName: string) => {
  // Request member data from github
  let res = (await octokit.request(`GET /orgs/${orgName}/members`, {
    org: 'ORG',
  })) as GitResponseBasic;
  // If response is null or undefined, return null
  if (!res || res == undefined) {
    return null;
  }
  // If status is not 200, return 0
  if (res.status != 200) {
    return null;
  }
  // Else return the response
  return res;
};

/**
 * Get a list with all the repos and their information corresponfing to an org
 * @param orgName The name of the organisation
 * @returns NULL or a CrawlerOrgRepository object with the repository list
 */
export const git_getOrgRepositoryList = async (orgName: string) => {
  // Request repository list from github
  let res = (await octokit.request(`GET /orgs/${orgName}/repos`, {
    org: 'ORG',
  })) as CrawlerOrgRepository;
  // If response is null or undefined, return null;
  if (!res || res == undefined) {
    return null;
  }
  // If response is not 200 return 0
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get all the contributors of a repository
 * @param ownerName The name of the owner of the repository
 * @param repoName The name of the repository
 * @returns NULL or a GitResponseBasic Object with the contributors list
 */
export const git_getRepositoryContributors = async (
  ownerName: string,
  repoName: string,
) => {
  // Get all the contributors from a git repository
  let res = (await octokit.request(
    `GET /repos/${ownerName}/${repoName}/contributors`,
    { owner: 'OWNER', repo: 'REPO' },
  )) as GitResponseBasic;
  // If reponse is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200 return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get all the commits of a repository
 * @param ownerName The name of the owner of the repository
 * @param repoName The name of the repository
 * @returns NULL or a GitResponseBasic Object with the contributors list
 */
export const git_getRepoCommits = async (
  ownerName: string,
  repoName: string,
) => {
  // Get all the commits of a repository
  let res = (await octokit.request(
    `GET /repos/${ownerName}/${repoName}/commits`,
    { owner: 'OWNER', repo: 'REPO' },
  )) as GithubResponseCommits;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get the pull requests from the specified type from the repo
 * @param ownerName The name of the owner of the repository
 * @param repoName The name of the repository
 * @param state The state of the pull requests. {open, closed, all}
 * @returns NULL or a GitResponseBasic object with the pull request list
 */
export const git_getPullRequests = async (
  ownerName: string,
  repoName: string,
  state: string,
) => {
  // If the given state is not open, closed or all, return null
  if (state != 'open' && state != 'closed' && state != 'all') {
    return null;
  }
  // Get all the pull requests for repo
  let res = (await octokit.request(
    `GET /repos/${ownerName}/${repoName}/pulls?state=${state}`,
    { owner: 'OWNER', repo: 'REPO' },
  )) as GitResponseBasic;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get the issues with the specified state from the repo
 * @param ownerName The name of the owner of the repository
 * @param repoName The name of the repository
 * @param state The state of the pull requests. {open, closed, all}
 * @returns NULL or a GitResponseBasic object with the issues list
 */
export const git_getIssues = async (
  ownerName: string,
  repoName: string,
  state: string,
) => {
  // If the given state is not open, closed or all, return null
  if (state != 'open' && state != 'closed' && state != 'all') {
    return null;
  }
  // Get all the issues for repo
  let res = (await octokit.request(
    `GET /repos/${ownerName}/${repoName}/issues?state=${state}`,
    { owner: 'OWNER', repo: 'REPO' },
  )) as GitResponseBasic;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get all the comments for the repository
 * @param ownerName The name of the owner of the repositors
 * @param repoName The name of the repository
 * @returns NULL or a GitResponseBasic object with the issues list
 */
export const git_getComments = async (ownerName: string, repoName: string) => {
  // Get all the comments for the repo
  let res = (await octokit.request(
    `GET /repos/${ownerName}/${repoName}/comments`,
    { owner: 'OWNER', repo: 'REPO' },
  )) as GitResponseBasic;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get the difference between two commits.
 * @param ownerName The name of the owner of the repo
 * @param repoName The name of the repo
 * @returns NULL or a GitResponseBasic object with the compare object
 */
export const git_compareTwoCommits = async (
  ownerName: string,
  repoName: string,
  parentOwnerName: string,
  defaultBranch: string,
) => {
  // Compare two commits
  let basehead = `master...${parentOwnerName}${defaultBranch}`;
  let res = (await octokit.rest.repos.compareCommitsWithBasehead({
    owner: ownerName,
    repo: repoName,
    basehead: basehead,
  })) as GitResponseBasic;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get All the Info from a user
 * @param username The username of the user. Is the "login" entry in the contributor object
 * @returns NULL ot a GitResponseBasic object with a user list
 */
export const git_getUser = async (username: string) => {
  let res = (await octokit.request(`GET /users/${username}`, {
    username: 'USERNAME',
  })) as GitResponseBasic;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get all the languages used in the repository
 * @param ownerName The name of the owner of the repository
 * @param repoName  The name of the repository
 * @returns NULL or a GithubResponseLanguages object with the Languages object
 */
export const git_getLanguages = async (ownerName: string, repoName: string) => {
  let res = (await octokit.request(
    `GET /repos/${ownerName}/${repoName}/languages`,
    { owner: 'OWNER', repo: 'REPO' },
  )) as GithubResponseLanguages;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get the specified repository
 * @param ownerName The name of the owner of the repository
 * @param repoName The repository name
 * @returns NULL or a GithubResponse object with the repo data
 */
export const git_getRepository = async (
  ownerName: string,
  repoName: string,
) => {
  let res = (await octokit.request(`GET /repos/${ownerName}/${repoName}`, {
    owner: 'OWNER',
    repo: 'REPO',
  })) as GithubResponse;
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};

/**
 * Get the commit activity of the last year
 * @param ownerName The name of the owner of the repository
 * @param repoName The repository name
 * @returns NULL or a GithubResponse object with the acitivty data
 */
export const git_getCommitActivity = async (
  ownerName: string,
  repoName: string,
) => {
  let res: GithubResponse = {
    status: null,
    url: null,
    headers: null,
    data: null,
  };
  while (res.status != 200) {
    res = (await octokit.rest.repos.getCommitActivityStats({
      owner: ownerName,
      repo: repoName,
    })) as GithubResponse;
    setTimeout(() => {}, 500);
  }
  // If response is null or undefined return null
  if (!res || res == undefined) {
    return null;
  }
  // If response status is not 200, return null
  if (res.status != 200) {
    return null;
  }
  // Else return the response object
  return res;
};
