import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { OctokitResponse } from '@octokit/types';
import { GithubService } from 'src/github/github.service';
import {
  Contributions,
  GitHubCommitComment,
  GitHubIssue,
  GitHubPull,
  GithubCommit,
  GithubCommitActivity,
  GithubCommitComparison,
  GithubContributor,
  GithubOrganisation,
  GithubOrganisationMember,
  GithubOrganisationRepository,
  GithubRepo,
  GithubUser,
  Languages,
  OrganisationContributions,
  Organization,
  Repository,
  RepositoryContributions,
  RepositoryInfo,
  User,
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';
import { v4 as uuidv4 } from 'uuid';

// TODO - check how many github calls were made, with the headers
// TODO - merge createContributionObject and mergeContributions
// TODO - get more than one page from github
// TODO - big object from all data
// TODO - Organisation watchers count is wrong as the repository object doesnt contain that number
// TODO - var for the database, as it is in plain text
// TODO - var for the github token
@Injectable()
export class DataGatheringService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    private githubService: GithubService,
    private mongoService: MongoDbService,
  ) {}
  async onApplicationBootstrap() {
    this.prepareInstitutions();
  }
  async onApplicationShutdown(signal?: string) {}

  private readonly logger = new Logger(DataGatheringService.name);

  private async prepareInstitutions() {
    // Get all todo institutions from db
    // Get all Insitutions and add them into objects
    // Foreach institution
  }

  private async handleInstitution() {
    // Create a institution object
    // For each org in the institution
    // get the org data (handleorg)
    // update the the institution data
    // After loop, get the old institution
    // Creat a stats array
    // Use the old stats object as base
    // Create the new one and add it
    // add the array to the institution object
    // Write that into the database
  }

  private async handleOrg(orgName: string, institutionName: string) {
    this.logger.log(`Handling Organisation ${orgName}`);
    const gitOrganisation = await this.getGitHubOrganisation(
      institutionName,
      orgName,
    );
    const members = await this.getGithubOrganisationMembers(
      orgName,
      institutionName,
    );
    const repositories = await this.getGitHubOrganisationRepositories(
      orgName,
      institutionName,
    );
    let organisation = await this.createOrganisationObject(
      gitOrganisation,
      members.length,
    );
    for (const repository of repositories) {
      const newRepo = await this.handleRepo(
        repository,
        institutionName,
        organisation.name,
      );
      if (!newRepo) continue;
      organisation = await this.updateOrganisationData(organisation, newRepo);
    }
    return organisation;
  }

  /**
   * Handle all the repository creation
   * @param repo The repository info object which comes with the organisation github data
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or the new repository
   */
  private async handleRepo(
    repo: GithubOrganisationRepository,
    institutionName: string,
    orgName: string,
  ): Promise<null | Repository> {
    this.logger.log(`Handling repo ${repo.name}`);
    const gitRepository = await this.getGitHubRepository(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!gitRepository) return null;
    const contributors = await this.getGitHubRepositoryContibutors(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!contributors) return null;
    const commits = await this.getGitHubRepositoryCommits(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!commits) return null;
    const allPulls = await this.getGitHubPullRequests(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'all',
    );
    if (!allPulls) return null;
    const closedPulls = await this.getGitHubPullRequests(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'closed',
    );
    if (!closedPulls) return null;
    const allIssues = await this.getGitHubIssues(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'all',
    );
    if (!allIssues) return null;
    const closedIssues = await this.getGitHubIssues(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'closed',
    );
    if (!closedIssues) return null;
    const commitComments = await this.getGitHubRepoCommitComments(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!commitComments) return null;
    const languages = await this.getGitHubRepoLanguages(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!languages) return null;
    const commitAcitivity = this.getGitHubCommitActivity(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!commitAcitivity) return null;
    let aheadByCommits = 0;
    if (gitRepository.parent) {
      const comaparedCommits = await this.compareTwoGitHubCommits(
        repo.name,
        repo.owner.login,
        institutionName,
        orgName,
        gitRepository.parent.owner.login,
        gitRepository.source.default_branch,
        gitRepository.default_branch,
      );
      if (!comaparedCommits) return null;
      aheadByCommits = comaparedCommits.ahead_by;
    }
    let contributorNames: string[] = [];
    for (const contributor of contributors) {
      contributorNames.push(contributor.login);
      await this.handleUser(contributor, repo.name, orgName, institutionName);
    }
    const coders = await this.getCodersFromCommits(commits);
    const newRepo = await this.createRepoObject(
      gitRepository,
      institutionName,
      orgName,
      contributorNames,
      commits,
      languages,
      aheadByCommits,
      allIssues,
      closedIssues,
      allPulls,
      closedPulls,
      commitComments,
      coders,
    );
    await this.mongoService.createNewRepository(newRepo);
    return newRepo;
  }

  /**
   * Handle all the user creation and updating
   * @param contributor The Github contributor object
   * @param repoName The name of the repository
   * @param orgName The name of the organisaton
   * @param institutioName The name of the institution
   * @returns null or the created user object
   */
  private async handleUser(
    contributor: GithubContributor,
    repoName: string,
    orgName: string,
    institutioName: string,
  ): Promise<null | User> {
    this.logger.log(`Handling user ${contributor.login}`);
    const gitUser = await this.getGitHubUser(
      contributor.login,
      institutioName,
      orgName,
      repoName,
    );
    if (!gitUser) return null;
    const databaseUser = await this.getDatabaseUser(contributor.login);
    const contributionObject = await this.createContributionObject(
      repoName,
      orgName,
      institutioName,
      contributor.contributions,
    );
    let newUser = await this.createNewUserObject(
      gitUser,
      contributionObject,
      orgName,
      databaseUser.orgs,
    );
    if (!databaseUser) {
      await this.mongoService.createNewUser(newUser);
      return;
    }
    newUser.contributions = await this.mergeContributions(
      databaseUser.contributions,
      institutioName,
      orgName,
      repoName,
      contributionObject,
    );
    await this.mongoService.updateUser(newUser);
    return newUser;
  }

  /******************************************Helper Functions*******************************************************/

  /**
   * Get the specified user data from github
   * @param userName The username of the specified user
   * @param institutionName The name of the crawled institution (for logging purposes)
   * @param orgName The name of the crawled organisation (for logging purposes)
   * @param repoName The name of the crawled repository (for logging purposes)
   * @returns Null or a GithubUser object containing the data
   */
  private async getGitHubUser(
    userName: string,
    institutionName: string,
    orgName: string,
    repoName: string,
  ): Promise<null | GithubUser> {
    this.logger.log(`Getting userdata from github from user ${userName}`);
    const gitUserResponse = await this.githubService.get_User(userName);
    this.logger.log(`Alredy made ${1}/${1} calls. ${gitUserResponse.headers}`);
    this.mongoService.createRawResponse(
      'get_github_user',
      institutionName,
      orgName,
      repoName,
      userName,
      gitUserResponse,
    );
    if (gitUserResponse.status != 200) {
      this.logger.error(
        `Error while getting userdata from github from user ${userName}. Status is ${gitUserResponse.status}`,
      );
      return null;
    }
    return gitUserResponse.data as GithubUser;
  }

  /**
   * Get the specified repo data from github
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubRepo object containing the data
   */
  private async getGitHubRepository(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubRepo> {
    this.logger.log(`Getting all the data from the repository ${repoName}`);
    const gitRepoResponse = await this.githubService.get_Repository(
      owner,
      repoName,
    );
    this.logger.log(`Alredy made ${1}/${1} calls. ${gitRepoResponse.headers}`);
    this.mongoService.createRawResponse(
      'get_github_repo',
      institutionName,
      orgName,
      repoName,
      '',
      gitRepoResponse,
    );
    if (gitRepoResponse.status != 200) {
      this.logger.error(
        `Error while getting repo data from github from repository ${repoName}. Status is ${gitRepoResponse.status}`,
      );
      return null;
    }
    return gitRepoResponse.data as GithubRepo;
  }

  /**
   * Get all the contributors from a specified github repo
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubContributor array containing the data
   */
  private async getGitHubRepositoryContibutors(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubContributor[]> {
    this.logger.log(
      `Getting all the contributors from the repository ${repoName}`,
    );
    const gitRepoContributorsResponse =
      await this.githubService.get_RepoContributors(owner, repoName);
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${gitRepoContributorsResponse.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_contributors',
      institutionName,
      orgName,
      repoName,
      '',
      gitRepoContributorsResponse,
    );
    if (gitRepoContributorsResponse.status != 200) {
      this.logger.error(
        `Error while getting contributor data from github from repository ${repoName}. Status is ${gitRepoContributorsResponse.status}`,
      );
      return null;
    }
    return gitRepoContributorsResponse.data as GithubContributor[];
  }

  /**
   * Get all the commits from a specified github repo
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubCommit array containing the data
   */
  private async getGitHubRepositoryCommits(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubCommit[]> {
    this.logger.log(`Getting all the commits from the repository ${repoName}`);
    const getRepoCommitsReponse = await this.githubService.get_RepoCommits(
      owner,
      repoName,
    );
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getRepoCommitsReponse.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_commits',
      institutionName,
      orgName,
      repoName,
      '',
      getRepoCommitsReponse,
    );
    if (getRepoCommitsReponse.status != 200) {
      this.logger.error(
        `Error while getting commit data from github from repository ${repoName}. Status is ${getRepoCommitsReponse.status}`,
      );
      return null;
    }
    return getRepoCommitsReponse.data as GithubCommit[];
  }

  /**
   * Get all the commits from a specified github repo
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param state The state of the pull requests. Must be open, all or closed.
   * @returns Null or a GithubCommit array containing the data
   */
  private async getGitHubPullRequests(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
    state: 'all' | 'open' | 'closed',
  ): Promise<null | GitHubPull[]> {
    this.logger.log(
      `Getting all the pull requests with the state ${state} from the repository ${repoName}`,
    );
    const getRepoPullRequestsResponse = await this.githubService.get_RepoPulls(
      owner,
      repoName,
      state,
    );
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getRepoPullRequestsResponse.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_pull_requests',
      institutionName,
      orgName,
      repoName,
      '',
      getRepoPullRequestsResponse,
    );
    if (getRepoPullRequestsResponse.status != 200) {
      this.logger.error(
        `Error while getting pull request data from github from repository ${repoName}. Status is ${getRepoCommitsReponse.status}`,
      );
      return null;
    }
    return getRepoPullRequestsResponse.data as GitHubPull[];
  }

  /**
   * Get all the github issues from a specified repository with the specified state
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param state The state of the issues. Must be open, all or closed.
   * @returns Null or a GitHubIssue array containing the data
   */
  private async getGitHubIssues(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
    state: 'all' | 'open' | 'closed',
  ): Promise<null | GitHubIssue[]> {
    this.logger.log(
      `Getting all the issues with the state ${state} from the repository ${repoName}`,
    );
    const getRepoIssuesResponse = await this.githubService.get_RepoIssues(
      owner,
      repoName,
      state,
    );
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getRepoIssuesResponse.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_issues',
      institutionName,
      orgName,
      repoName,
      '',
      getRepoIssuesResponse,
    );
    if (getRepoIssuesResponse.status != 200) {
      this.logger.error(
        `Error while getting issues data from github from repository ${repoName}. Status is ${getRepoIssuesResponse.status}`,
      );
      return null;
    }
    return getRepoIssuesResponse.data as GitHubIssue[];
  }

  /**
   * Get all the commit comments from a specified repository
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GitHubCommitComment array containing the data
   */
  private async getGitHubRepoCommitComments(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GitHubCommitComment[]> {
    this.logger.log(
      `Getting all the commit comments from the repository ${repoName}`,
    );
    const getRepoCommitCommentsResult =
      await this.githubService.get_RepoCommitComments(owner, repoName);
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getRepoCommitCommentsResult.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_commit_comments',
      institutionName,
      orgName,
      repoName,
      '',
      getRepoCommitCommentsResult,
    );
    if (getRepoCommitCommentsResult.status != 200) {
      this.logger.error(
        `Error while getting commit comments data from github from repository ${repoName}. Status is ${getRepoCommitCommentsResult.status}`,
      );
      return null;
    }
    return getRepoCommitCommentsResult.data as GitHubCommitComment[];
  }

  /**
   * Get all the Programming Languages from a specified repository
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a Languages object containing the data
   */
  private async getGitHubRepoLanguages(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | Languages> {
    this.logger.log(
      `Getting all the programming languages from the repository ${repoName}`,
    );
    const getRepoLanguagesResult = await this.githubService.get_RepoLanguages(
      owner,
      repoName,
    );
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getRepoLanguagesResult.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_langauges',
      institutionName,
      orgName,
      repoName,
      '',
      getRepoLanguagesResult,
    );
    if (getRepoLanguagesResult.status != 200) {
      this.logger.error(
        `Error while getting commit comments data from github from repository ${repoName}. Status is ${getRepoLanguagesResult.status}`,
      );
      return null;
    }
    return getRepoLanguagesResult.data as Languages;
  }

  /**
   * Get the commit acitivity from the last year of the specified repository
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubCommitActivity array containing the data
   */
  private async getGitHubCommitActivity(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubCommitActivity[]> {
    this.logger.log(
      `Getting the commit activity from the repository ${repoName}`,
    );
    let getRepoCommitActivityResult: OctokitResponse<any>;
    while (true) {
      getRepoCommitActivityResult =
        await this.githubService.get_RepoCommitActivity(owner, repoName);
      this.logger.log(
        `Alredy made ${1}/${1} calls. ${getRepoCommitActivityResult.headers}`,
      );
      this.mongoService.createRawResponse(
        'get_github_commit_acitivity',
        institutionName,
        orgName,
        repoName,
        '',
        getRepoCommitActivityResult,
      );
      if (
        getRepoCommitActivityResult.status != 202 &&
        getRepoCommitActivityResult.status != 204
      ) {
        break;
      }
    }
    if (getRepoCommitActivityResult.status != 200) {
      this.logger.error(
        `Error while getting commit activity data from github from repository ${repoName}. Status is ${getRepoCommitActivityResult.status}`,
      );
      return null;
    }
    return getRepoCommitActivityResult.data as GithubCommitActivity[];
  }

  /**
   * Get the organisation data from github
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubOrganisation object containing the data
   */
  private async getGitHubOrganisation(
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubOrganisation> {
    this.logger.log(`Getting all the data of the organisation ${orgName}`);
    const getOrganisationResult = await this.githubService.get_Organisation(
      orgName,
    );
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getOrganisationResult.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_organisation',
      institutionName,
      orgName,
      '',
      '',
      getOrganisationResult,
    );
    if (getOrganisationResult.status != 200) {
      this.logger.error(
        `Error while getting organisation data from github from the organisation ${orgName}. Status is ${getOrganisationResult.status}`,
      );
      return null;
    }
    return getOrganisationResult.data as GithubOrganisation;
  }

  /**
   * Get all the members from a organisation from github
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubOrganisationMember array containing the data
   */
  private async getGithubOrganisationMembers(
    orgName: string,
    institutionName: string,
  ): Promise<null | GithubOrganisationMember[]> {
    this.logger.log(`Getting all the members of the organisation ${orgName}`);
    const getOrganisationMembersResult =
      await this.githubService.get_OrganisationMembers(orgName);
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${getOrganisationMembersResult.headers}`,
    );
    this.mongoService.createRawResponse(
      'get_github_organisation_members',
      institutionName,
      orgName,
      '',
      '',
      getOrganisationMembersResult,
    );
    if (getOrganisationMembersResult.status != 200) {
      this.logger.error(
        `Error while getting organisation members data from github from the organisation ${orgName}. Status is ${getOrganisationMembersResult.status}`,
      );
      return null;
    }
    return getOrganisationMembersResult.data as GithubOrganisationMember[];
  }

  /**
   * Get all the repositories from a repository from github"
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null or a GithubOrganisationRepository array containing the data
   */
  private async getGitHubOrganisationRepositories(
    orgName: string,
    institutionName: string,
  ): Promise<null | GithubOrganisationRepository[]> {
    this.logger.log(
      `Getting all the repositories of the organisation ${orgName}`,
    );
    const getOrganisationRepositoriesResult =
      await this.githubService.get_OrganisationRepositories(orgName);
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${
        getOrganisationRepositoriesResult.headers
      }`,
    );
    this.mongoService.createRawResponse(
      'get_github_organisation_repositories',
      institutionName,
      orgName,
      '',
      '',
      getOrganisationRepositoriesResult,
    );
    if (getOrganisationRepositoriesResult.status != 200) {
      this.logger.error(
        `Error while getting organisation repositories data from github from the organisation ${orgName}. Status is ${getOrganisationRepositoriesResult.status}`,
      );
      return null;
    }
    return getOrganisationRepositoriesResult.data as GithubOrganisationRepository[];
  }

  /**
   *
   * @param repoName The name of the repository
   * @param owner The name of the owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param parentOwner The name of the owner of the parent repository
   * @param parentDefaultBranch The name of the default branch of the parent repository
   * @param defaultBranch The name of the default branch of the current repository
   * @returns Null or a GithubCommitComparison object containing the data
   */
  private async compareTwoGitHubCommits(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
    parentOwner: string,
    parentDefaultBranch: string,
    defaultBranch: string,
  ): Promise<null | GithubCommitComparison> {
    this.logger.log(
      `Comparing two commits between :${defaultBranch} and ${parentOwner}:${parentDefaultBranch}.`,
    );
    const compareTwoCommitsResult = await this.githubService.compare_Commits(
      owner,
      repoName,
      parentOwner,
      parentDefaultBranch,
      defaultBranch,
    );
    this.logger.log(
      `Alredy made ${1}/${1} calls. ${compareTwoCommitsResult.headers}`,
    );
    this.mongoService.createRawResponse(
      'compare_github_commits',
      institutionName,
      orgName,
      repoName,
      '',
      compareTwoCommitsResult,
    );

    if (compareTwoCommitsResult.status != 200) {
      this.logger.error(
        `Error while comparing :${defaultBranch} and ${parentOwner}:${parentDefaultBranch}. Status is ${compareTwoCommitsResult.status}`,
      );
      return null;
    }
    return compareTwoCommitsResult.data as GithubCommitComparison;
  }

  /**
   * Get the specified user data from the database
   * @param userName The username of the specified user
   * @returns Null or a User object containing the data of the specified user
   */
  private async getDatabaseUser(userName: string): Promise<null | User> {
    this.logger.log(
      `Getting the userdata from the database with the username ${userName}.`,
    );
    let databaseUser = await this.mongoService.findUser(userName);
    if (!databaseUser) return null;
    return databaseUser;
  }

  /**
   * Create the new contribution object to add to the user
   * @param repoName The name of the repository
   * @param orgName The name of the organisation
   * @param institutionName The name of the institution
   * @param numberOfContributions The number of contributions this user has made to this repo
   * @returns The new contribution object
   */
  private async createContributionObject(
    repoName: string,
    orgName: string,
    institutionName: string,
    numberOfContributions: number,
  ): Promise<Contributions> {
    let repoContribution: RepositoryContributions = {
      [repoName]: numberOfContributions,
    };
    let orgContribution: OrganisationContributions = {
      [orgName]: repoContribution,
    };
    let contribution: Contributions = { [institutionName]: orgContribution };
    return contribution;
  }

  /**
   * Create a new user object
   * @param githubUser A GithubUser object
   * @param contibutions The Contributions Object of the user
   * @param orgName The organisation name
   * @param savedOrgs The orgs that where alredy saved in the database (else a empty string array)
   * @returns A new user object
   */
  private async createNewUserObject(
    githubUser: GithubUser,
    contibutions: Contributions,
    orgName: string,
    savedOrgs: string[],
  ): Promise<User> {
    if (!(orgName in savedOrgs)) savedOrgs.push(orgName);
    let newUser: User = {
      login: githubUser.login,
      name: githubUser.name,
      avatar_url: githubUser.avatar_url,
      bio: githubUser.bio,
      blog: githubUser.blog,
      company: githubUser.company,
      email: githubUser.email,
      twitter_username: githubUser.twitter_username,
      location: githubUser.location,
      created_at: new Date(githubUser.created_at),
      updated_at: new Date(githubUser.updated_at),
      contributions: contibutions,
      public_repos: githubUser.public_repos,
      public_gists: githubUser.public_gists,
      followers: githubUser.followers,
      following: githubUser.following,
      orgs: savedOrgs,
    };
    return newUser;
  }

  /**
   * Merge two contribution objects (the one from the database and the new one)
   * @param dbContributions The contributions object from the database user
   * @param institutionName The name of the current institution
   * @param orgName The name of the organisation
   * @param repoName The name of the repository
   * @param newContribution The new contribution
   * @returns The merged contribution object
   */
  private async mergeContributions(
    dbContributions: Contributions,
    institutionName: string,
    orgName: string,
    repoName: string,
    newContribution: Contributions,
  ): Promise<Contributions> {
    if (!dbContributions[institutionName]) {
      Object.assign(dbContributions, newContribution);
    } else if (!dbContributions[institutionName][orgName]) {
      Object.assign(
        dbContributions[institutionName],
        newContribution[institutionName],
      );
    } else if (!dbContributions[institutionName][orgName][repoName]) {
      Object.assign(
        dbContributions[institutionName][orgName],
        newContribution[institutionName][orgName],
      );
    }
    return dbContributions;
  }

  /**
   * Get all the coders out of the repository commits
   * @param commits All the repository commits
   * @returns A list of coder names
   */
  private async getCodersFromCommits(
    commits: GithubCommit[],
  ): Promise<string[]> {
    let coders: string[] = [];
    for (const commit of commits) {
      if (!commit.author) continue;
      if (commit.author.login in coders) continue;
      coders.push(commit.author.login);
    }
    return coders;
  }

  /**
   * Create a Repository Object
   * @param githubRepo A github repo object
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param contributorNames The names of the contributors
   * @param commits A list of all commits of the repository
   * @param languages A list with all the programming Languages used in the repository
   * @param ahead_by How many commits this repository is ahead of its parent (if it is a fork)
   * @param allIssues All the issues of the repository
   * @param closedIssues All the closed issues of the repository
   * @param allPullRequests All the pull requests of the repository
   * @param closedPullRequests All the closed pull requests of the repository
   * @param comments All the commit comments of the repository
   * @param coders All the coders of the repository
   * @returns A Repository object
   */
  private async createRepoObject(
    githubRepo: GithubRepo,
    institutionName: string,
    orgName: string,
    contributorNames: string[],
    commits: GithubCommit[],
    languages: Languages,
    ahead_by: number,
    allIssues: GitHubIssue[],
    closedIssues: GitHubIssue[],
    allPullRequests: GitHubPull[],
    closedPullRequests: GitHubPull[],
    comments: GitHubCommitComment[],
    coders: string[],
  ): Promise<Repository> {
    const repo: Repository = {
      name: githubRepo.name,
      uuid: uuidv4(),
      url: githubRepo.html_url,
      institution: institutionName,
      organization: orgName,
      description: githubRepo.description,
      fork: githubRepo.fork,
      archived: githubRepo.archived,
      num_forks: githubRepo.forks_count,
      num_contributors: contributorNames.length,
      num_commits: commits.length,
      num_stars: githubRepo.stargazers_count,
      num_watchers: githubRepo.subscribers_count,
      has_own_commits: ahead_by,
      issues_closed: closedIssues.length,
      issues_all: allIssues.length,
      pull_requests_closed: closedPullRequests.length,
      pull_requests_all: allPullRequests.length,
      comments: comments.length,
      languages: languages,
      timestamp: new Date(),
      createdTimestamp: new Date(githubRepo.created_at),
      updatedTimestamp: new Date(githubRepo.updated_at),
      contributors: contributorNames,
      coders: coders,
      license: githubRepo.license ? githubRepo.license.name : 'none',
      logo: githubRepo.owner.avatar_url,
    };

    return repo;
  }

  /**
   * Create a organisation Object
   * @param organisation A Github Organisation Object
   * @param memberCount The number of members in the organisation
   * @returns A Organisation Object
   */
  private async createOrganisationObject(
    organisation: GithubOrganisation,
    memberCount: number,
  ): Promise<Organization> {
    const newOrg: Organization = {
      num_repos: 0,
      num_members: memberCount,
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
      name: organisation.name,
      url: organisation.url,
      description: organisation.description,
      avatar: organisation.avatar_url,
      created_at: new Date(organisation.created_at),
      location: organisation.location,
      email: organisation.email,
      repos: [],
      repo_names: [],
      total_licenses: {},
    };
    return newOrg;
  }

  /**
   * Update the Organisation with repository Data
   * @param organisation The organisation object
   * @param repository The repository object
   * @returns The updated organisation object
   */
  private async updateOrganisationData(
    organisation: Organization,
    repository: Repository,
  ): Promise<Organization> {
    if (repository.fork) {
      organisation.total_num_forks_in_repos++;
      organisation.total_num_commits += repository.has_own_commits;
    } else {
      organisation.total_num_stars += repository.num_stars;
      organisation.total_num_contributors += repository.num_contributors;
      organisation.total_num_commits += repository.num_commits;
      organisation.total_num_own_repo_forks += repository.num_forks;
      organisation.total_num_watchers += 0;
      organisation.total_pull_requests_all += repository.pull_requests_all;
      organisation.total_pull_requests_closed +=
        repository.pull_requests_closed;
      organisation.total_issues_all += repository.issues_all;
      organisation.total_issues_closed += repository.issues_closed;
      organisation.total_comments += repository.comments;
      if (repository.license in organisation.total_licenses) {
        organisation.total_licenses[repository.license]++;
      } else {
        organisation.total_licenses[repository.license] = 1;
      }
    }
    organisation.repos.push(repository.uuid);
    organisation.repo_names.push(repository.name);
    return organisation;
  }
}
