import {
  CrawlerTodoInstitution,
  OrgData,
  Institution,
  RepositoryInfo,
  Stats,
} from 'src/data-types';
import {
  Contributions,
  OrganisationContributions,
  Repository,
  RepositoryContributions,
  RepositoryNew,
  User,
  CommitActivity,
} from 'src/interfaces';
import { v4 as uuidv4 } from 'uuid';
import {
  connectToDatabase,
  db_getUser,
  db_readInstitution,
  db_readTodoInstitutions,
  db_createRawResponse,
  db_createRepository,
  db_createUser,
  db_UpdateUser,
  db_Update_Create_Institution,
} from './services/database.service';
import {
  git_compareTwoCommits,
  connectToGithub,
  git_getComments,
  git_getIssues,
  git_getMembers,
  git_getOragnisation,
  git_getOrgRepositoryList,
  git_getPullRequests,
  git_getRepoCommits,
  git_getRepositoryContributors,
  git_getUser,
  git_getLanguages,
  git_getRepository,
  git_getCommitActivity,
} from './services/github.service';

// TODO - add info output on which org we are, instutiton, repo etc
// TODO - why removing users new
// TODO - only gets the first 30 commits/contributors etc
// TODO - logging in the if statement
// TODO - Add class
// TODO - NEST Patterns
// TODO - Grosses Objekt aus allen daten
// TODO - SLAP
// TODO - Nest Logger for errors
// TODO - git time logging
// TODO - new types

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
  todoInstitution.githubrepos.forEach((industry) => {
    industry[1].institutions.forEach((institution) => {
      institutionList.push(institution);
    });
  });
  // If list is undefined or empty, return error
  if (
    institutionList == undefined ||
    !institutionList ||
    institutionList.length == 0
  ) {
    console.error('Did not find any institutions to crawl. Returning');
    return -1;
  }
  // Get all orgs from an institution from github
  let testData = [institutionList[0]];
  // For each instution
  for (const todoInstitution of testData) {
    console.log(todoInstitution.name_de);

    // Create Institution object
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
      sector: '',
      stats: [],
    };
    for (const orgName of todoInstitution.orgs) {
      // Get the organisation object
      let org = await getOrganisation(orgName, todoInstitution.shortname);
      // If the response is null or undefined, skip this organisation
      if (!org || org == undefined) {
        continue;
      }
      // Update institution Data
      institution.orgs.push(org);
      institution.num_orgs += 1;
      institution.num_members += org.num_members;
      institution.num_repos += org.num_repos;
      institution.avatar.push(org.avatar);
      institution.org_names.push(orgName);
      institution.sector = ''; // TODO - need to get sector key, maybe put it directy in line 22??
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
      institution.repos = institution.repo_names.concat(org.repos);
      institution.repo_names = institution.repo_names.concat(org.repo_names);
    }
    // Get the old Institution
    let oldInstitution = await db_readInstitution(institution.uuid);
    // Create stats array
    let stats: Stats[] = [];
    // If the oldInstitutionExists and has a stats object, use that as base
    if (oldInstitution && oldInstitution.stats) {
      stats = oldInstitution.stats;
    }
    // Create a stat object
    let stat: Stats = {
      timestamp: new Date(),
      num_repos: institution.num_repos,
      num_members: institution.num_members,
      total_num_contributors: institution.total_num_commits,
      total_num_own_repo_forks: institution.total_num_own_repo_forks,
      total_num_forks_in_repos: institution.total_num_forks_in_repos,
      total_num_commits: institution.total_num_commits,
      total_pull_requests: institution.total_pull_requests,
      total_issues: institution.total_issues,
      total_num_stars: institution.total_num_stars,
      total_num_watchers: institution.total_num_watchers,
      total_pull_requests_all: institution.total_pull_requests,
      total_pull_requests_closed: institution.total_pull_requests_closed,
      total_issues_all: institution.total_issues_all,
      total_issues_closed: institution.total_issues_closed,
      total_comments: institution.total_comments,
    };
    // Append the new stat object to the stats array
    stats.push(stat);
    // And add that to the institution
    institution.stats = stats;
    // Save institution Data
    await db_Update_Create_Institution(institution);
  }
};

const getOrganisation = async (orgName: string, institutioName: string) => {
  console.log(orgName);

  // Get all organisation Data from Github
  let org = await git_getOragnisation(orgName);
  // If organisation is null, skip it
  if (!org || org == undefined) {
    return null;
  }
  // Write the reponse Object to the Database
  await db_createRawResponse(org, 'get_org', institutioName, orgName);
  // Get the number of members in the organisation
  let members = await git_getMembers(orgName);
  // If members is null or undefined, skip the organisation
  if (!members || members == undefined) {
    return null;
  }
  // Write the response Object to the Database
  await db_createRawResponse(members, 'get_members', institutioName, orgName);
  // Get the member count
  let memberCount = Object.keys(members.data).length;
  // Get the list of all repositories corresponding to the org
  let repoList = await git_getOrgRepositoryList(orgName);
  // If the list is null or undefined, skip this org
  if (!repoList || repoList == undefined) {
    return null;
  }
  // Write the response object to the database
  await db_createRawResponse(
    repoList,
    'get_repo_list',
    institutioName,
    orgName,
  );
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
    total_comments: 0,
  };
  // For all repos
  for (const repo of repoList.data) {
    orgData = await getRepository(
      repo,
      orgData,
      institutioName,
      org.data.login,
    );
  }
  return orgData;
};

/**
 * Get repo info from github and save it to the database. Return the updated organisation data
 * @param repo The RepositoryInfo Object
 * @param orgData The OrgData Object. This will be updated and returned.
 * @param institutioName The Name of the Institution.
 * @param orgName The name of the Organisation. This data is not saved in the orgData object.
 * @returns The Updated OrgData object
 */
const getRepository = async (
  repo: RepositoryInfo,
  orgData: OrgData,
  institutioName: string,
  orgName: string,
) => {
  console.log(repo.name);
  // Generate a uuid for the repository
  repo.uuid = uuidv4();
  // Get the repository
  let repositoryCompleat = await git_getRepository(repo.owner.login, repo.name);
  // If repositoryCompleat is null or undefined skip this repo
  if (!repositoryCompleat || repositoryCompleat == undefined) {
    console.error(
      `Error while getting contributors for the ${repo.name} repo!`,
    );
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    repositoryCompleat,
    'get_repo_full',
    institutioName,
    orgName,
    repo.name,
  );
  // Set how many commits its ahead (if it is forked, ahead from the original)
  let ahead_by = 0;
  // If there exists a parent, this is a fork
  if (repositoryCompleat.data['parent']) {
    // Get the difference between master and master. That will show if they made own commits to the fork or not.
    let aheadByCommits = await git_compareTwoCommits(
      repo.owner.login,
      repo.name,
      repositoryCompleat.data['parent']['owner']['login'],
      ':' + repositoryCompleat.data['source']['default_branch'],
    );
    // If the aheadByCommits is null or undefined skip this repo
    if (!aheadByCommits || aheadByCommits == undefined) {
      return;
    }
    // Write the response to the database
    await db_createRawResponse(
      aheadByCommits,
      'get_repo_ahead_commits',
      institutioName,
      orgName,
      repo.name,
    );
    // Get the number of commits ahead of the parent
    ahead_by = aheadByCommits.data['ahead_by'];
  }
  // Get all the contributors of the repository
  let contributors = await git_getRepositoryContributors(
    repo.owner.login,
    repo.name,
  );
  // If the contributors are null or undefined skip this repo
  if (!contributors || contributors == undefined) {
    console.error(
      `Error while getting contributors for the ${repo.name} repo!`,
    );
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    contributors,
    'get_repo_contributors',
    institutioName,
    orgName,
    repo.name,
  );
  // Get all the commits of the repository
  let commits = await git_getRepoCommits(repo.owner.login, repo.name);
  // If commits is null or undefined skip this repo
  if (!commits || commits == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    commits,
    'get_repo_commits',
    institutioName,
    orgName,
    repo.name,
  );
  // Get all pull requests from repo
  let allPullRequests = await git_getPullRequests(
    repo.owner.login,
    repo.name,
    'all',
  );
  // If allPullRequests is null or undefined skip this repo
  if (!allPullRequests || allPullRequests == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    allPullRequests,
    'get_repo_pull_all',
    institutioName,
    orgName,
    repo.name,
  );
  // Get the closed pull requests
  let closedPullRequests = await git_getPullRequests(
    repo.owner.login,
    repo.name,
    'closed',
  );
  // If closedPullRequests is null or undefined skip this repo
  if (!closedPullRequests || closedPullRequests == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    closedPullRequests,
    'get_repo_pull_closed',
    institutioName,
    orgName,
    repo.name,
  );
  // Get all issues from repo
  let allIssues = await git_getIssues(repo.owner.login, repo.name, 'all');
  // If allPullRequests is null or undefined skip this repo
  if (!allIssues || allIssues == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    allIssues,
    'get_repo_issues_all',
    institutioName,
    orgName,
    repo.name,
  );
  // Get all comments from the database
  let comments = await git_getComments(repo.owner.login, repo.name);
  // If comments is null or undefined skip this repo
  if (!comments || comments == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    comments,
    'get_repo_commetns',
    institutioName,
    orgName,
    repo.name,
  );
  // Get all languages used in the repo
  let languages = await git_getLanguages(repo.owner.login, repo.name);
  // If langugages is null or undefined skip this repo
  if (!languages || languages == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    languages,
    'get_repo_languages',
    institutioName,
    orgName,
    repo.name,
  );
  // Get the commit activities from last year
  let commitActivities = await git_getCommitActivity(
    repo.owner.login,
    repo.name,
  );
  // If langugages is null or undefined skip this repo
  if (!commitActivities || commitActivities == undefined) {
    return orgData;
  }
  // Write the response to the database
  await db_createRawResponse(
    commitActivities,
    'get_repo_commit_activties',
    institutioName,
    orgName,
    repo.name,
  );
  // If the repo is not a fork, add data
  if (!repo.fork) {
    // Add repo information to the orgData
    orgData.total_num_stars += repo.stargazers_count;
    orgData.total_num_contributors += Object.keys(contributors.data).length;
    orgData.total_num_commits += Object.keys(commits.data).length;
    orgData.total_num_own_repo_forks += repo.forks_count;
    orgData.total_num_watchers += repo.watchers_count;
    orgData.total_pull_requests_all += Object.keys(allPullRequests.data).length;
    orgData.total_pull_requests_closed += Object.keys(
      closedPullRequests.data,
    ).length;
    orgData.total_issues_all += Object.keys(allIssues.data).length;
    orgData.total_issues_closed +=
      orgData.total_issues_all - repo.open_issues_count;
    orgData.total_comments += Object.keys(comments.data).length;
    // Set the licence name to none
    let licenceName: string = 'none';
    // If repo has a licence, set the licence name to that licence
    if (repo?.license?.name) {
      licenceName = repo.license.name;
    }
    // If org has the licence, increment it. If not, add it and set it to 1
    if (licenceName in orgData.total_licenses) {
      orgData.total_licenses[licenceName]++;
    } else {
      orgData.total_licenses[licenceName] = 1;
    }
  }
  // If this repository is a fork
  else {
    // Update the organisation data
    orgData.total_num_forks_in_repos++;
    orgData.total_num_commits += ahead_by;
  }
  // Cast contributors Data to users array
  let users = contributors.data as User[];
  let contributorNames: string[] = [];
  // Create all the contibutors or update them
  for (const user of users) {
    contributorNames.push(user.login);
    await createUser(user, repo.name, orgName, institutioName);
  }
  // Get all coder names
  let coders: string[] = [];
  for (const commit of commits.data) {
    // If the commit has no author, continue (Don't know how that can happen, but throws error if not checked)
    if (!commit.author) {
      continue;
    }
    // And if the author is alredy in the list, continue
    if (commit.author.login in coders) {
      continue;
    }
    // Add to array
    coders.push(commit.author.login);
  }
  // Create repo object
  let newRepo: RepositoryNew = {
    name: repo.name,
    uuid: repo.uuid,
    url: repo.html_url,
    institution: institutioName,
    organization: orgName,
    description: repo.description,
    fork: repo.fork,
    archived: repo.archived,
    num_forks: repo.forks_count,
    num_contributors: Object.keys(contributors.data).length,
    num_commits: Object.keys(commits.data).length,
    num_stars: repo.stargazers_count,
    num_watchers: repositoryCompleat.data['subscribers_count'],
    commit_activities: commitActivities.data as CommitActivity[],
    has_own_commits: ahead_by,
    issues_closed: orgData.total_issues_all - repo.open_issues_count,
    issues_all: Object.keys(allIssues.data).length,
    pull_requests_closed: Object.keys(closedPullRequests.data).length,
    pull_requests_all: Object.keys(allPullRequests.data).length,
    comments: Object.keys(comments.data).length,
    languages: languages.data,
    timestamp: new Date(),
    createdTimestamp: new Date(repo.created_at),
    updatedTimestamp: new Date(repo.updated_at),
    contributors: contributorNames,
    coders: coders,
    license: repo.license ? repo.license.name : 'none',
    logo: repo.owner.avatar_url,
  };
  // Write repo to the database
  await db_createRepository(newRepo);
  // Update the org Data
  orgData.repos.push(repo.uuid);
  orgData.repo_names.push(repo.name);
  return orgData;
};

/**
 * Create a new user in the database or update an old one
 * @param user The user object
 * @param repoName The name of the Repository
 * @param orgName The name of the organisations
 * @param institutionName The name of the institution
 * @returns nothing
 */
const createUser = async (
  user: User,
  repoName: string,
  orgName: string,
  institutionName: string,
) => {
  // Get the user data from github
  let fullUserData = (await (await git_getUser(user.login)).data) as User;
  // Get the user data from the database
  let userInDB = await db_getUser(fullUserData.login);
  // Get the number of contributions made in this repo
  let numberOfContributions = user.contributions as unknown as number;
  // Create contribution object
  let repoContribution: RepositoryContributions = {
    [repoName]: numberOfContributions,
  };
  let orgContribution: OrganisationContributions = {
    [orgName]: repoContribution,
  };
  let contributions: Contributions = { [institutionName]: orgContribution };

  // Create user object to save
  let newUser: User = {
    login: fullUserData.login,
    name: fullUserData.name,
    avatar_url: fullUserData.avatar_url,
    bio: fullUserData.bio,
    blog: fullUserData.blog,
    company: fullUserData.company,
    email: fullUserData.email,
    twitter_username: fullUserData.twitter_username,
    location: fullUserData.location,
    created_at: new Date(fullUserData.created_at),
    updated_at: new Date(fullUserData.updated_at),
    contributions: {},
    public_repos: fullUserData.public_repos,
    public_gists: fullUserData.public_gists,
    followers: fullUserData.followers,
    following: fullUserData.following,
    orgs: [],
  };
  // If user is not in the Database
  if (!userInDB) {
    // Add contributions
    newUser.contributions = contributions;
    // Add Orgs
    newUser.orgs.push(orgName);
    // Save him
    await db_createUser(newUser);
    return;
  }
  // Get contributions
  let dbContributions = userInDB.contributions;
  // If the instituion doesnt exist in the user contribution, add it. Same with organisation and repository
  if (!dbContributions[institutionName]) {
    Object.assign(dbContributions, contributions);
  } else if (!dbContributions[institutionName][orgName]) {
    Object.assign(dbContributions[institutionName], orgContribution);
  } else if (!dbContributions[institutionName][orgName][repoName]) {
    Object.assign(dbContributions[institutionName][orgName], repoContribution);
  }
  // Add contibutions
  newUser.contributions = dbContributions;
  // Add Orgs
  newUser.orgs = userInDB.orgs;
  if (!(orgName in newUser.orgs)) {
    newUser.orgs.push(orgName);
  }
  // And add to database
  await db_UpdateUser(newUser);
};

coordinator();

export default coordinator;
