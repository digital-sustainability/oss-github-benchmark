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
  Institution,
  Languages,
  OrganisationContributions,
  Organisation,
  RawResponse,
  Repository,
  RepositoryContributions,
  Statistic,
  TodoInstitution,
  User,
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { Cron, CronExpression } from '@nestjs/schedule';

// TODO - big object from all data
// TODO - frontend values are not accessed correctly

@Injectable()
export class DataGatheringService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    private githubService: GithubService,
    private mongoService: MongoDbService,
  ) {}

  async onApplicationShutdown(signal?: string) {}
  async onApplicationBootstrap() {
    this.logPath = process.env.LOG_PATH || '/logs';
    this.prepareInstitutions();
  }

  private readonly logger = new Logger(DataGatheringService.name);
  private logPath: string;
  private reachedGithubCallLimit: boolean;
  private daysToWait = 7 * 24 * 60 * 60 * 1000; // Days * 24 hours * 60 minutes * 60 seconds * 1000 miliseconds

  /**
   * Prepare all the insitutions and call handle institution
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async prepareInstitutions() {
    this.reachedGithubCallLimit = false;
    this.logger.log(`Prepairing all institutions to be crawled`);
    const todoInstituitions = await this.mongoService.findAllTodoInstitutions();
    todoInstituitions.sort((a, b) => {
      if (!a.ts && !b.ts) return 0;
      if (!a.ts) return -1;
      if (!b.ts) return 1;
      return b.ts.getTime() - a.ts.getTime();
    });
    for (const todoInstituition of todoInstituitions) {
      /*if (todoInstituition.ts?.getTime() > Date.now() - this.daysToWait) {
        this.logger.log(
          `The institution ${todoInstituition.name_de} was alredy crawled in the defined time`,
        );
        continue;
      }*/
      await this.handleInstitution(todoInstituition, todoInstituition.sector);
      await this.mongoService.updateTodoInstitutionTimestamp(
        todoInstituition.uuid,
      );
    }
    this.logger.log('Crawler finished');
  }

  /**
   * Handle all the insitution data
   * @param institution The institution todo
   * @param sector The sector of the insitution
   */
  private async handleInstitution(
    institution: TodoInstitution,
    sector: string,
  ) {
    this.logger.log(`Handling institution ${institution.name_de}`);
    let newInstitution = await this.createInstitutionObject(
      institution,
      sector,
    );
    const oldInstitution = await this.mongoService.findInstitutionWithUUID(
      institution.uuid,
    );
    institution.orgs.sort((a, b) => {
      if (!a.ts && !b.ts) return 0;
      if (!a.ts) return -1;
      if (!b.ts) return 1;
      return b.ts.getTime() - a.ts.getTime();
    });
    for (let i = 0; i < institution.orgs.length; i++) {
      if (this.reachedGithubCallLimit) break;
      const organisation = institution.orgs[i];
      if (organisation.ts?.getTime() > Date.now() - this.daysToWait) {
        this.logger.log(
          `The organisation ${organisation.name} was alredy crawled in the last defined time`,
        );
        continue;
      }
      const newOrganisation = await this.handleOrg(
        organisation.name,
        institution.shortname,
      );
      if (!newOrganisation) continue;
      newInstitution = await this.updateInstitutionWithOrgData(
        newOrganisation,
        newInstitution,
      );
      this.mongoService.upsertOrg(newOrganisation);
      organisation.ts = new Date();
      institution.orgs[i] = organisation;
      await this.mongoService.updateOrgTimestamp(institution);
      i = institution.orgs.length;
    }
    const stats: Statistic[] = oldInstitution ? oldInstitution.stats : [];
    const newStatistic = await this.createStatistics(newInstitution);
    stats.push(newStatistic);
    newInstitution.stats = stats;
    await this.mongoService.upsertInstitution(newInstitution);
  }

  /**
   * Handle all the organisation data
   * @param orgName The name of the organisation
   * @param institutionName The name of the institution
   * @returns The Organisation Object
   */
  private async handleOrg(
    orgName: string,
    institutionName: string,
  ): Promise<Organisation> {
    this.logger.log(`Handling Organisation ${orgName}`);
    const dbOrganisation = await this.mongoService.findOrganisationWithName(
      orgName,
    );
    const gitOrganisation = await this.getGitHubOrganisation(
      institutionName,
      orgName,
    );
    if (!gitOrganisation) return null;
    const members = await this.getGithubOrganisationMembers(
      orgName,
      institutionName,
    );
    if (!members) return null;
    const repositories = await this.getGitHubOrganisationRepositories(
      orgName,
      institutionName,
    );
    if (!repositories) return null;
    let organisation = dbOrganisation
      ? await this.updateOrganisationObject(
          dbOrganisation,
          gitOrganisation,
          members.length,
        )
      : await this.createOrganisationObject(
          gitOrganisation,
          members.length,
          orgName,
        );
    for (const repository of repositories) {
      if (this.reachedGithubCallLimit) return organisation;
      const newRepo = await this.handleRepo(
        repository,
        institutionName,
        orgName,
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
    const commitAcitivity = await this.getGitHubCommitActivity(
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
    const contributorNames: string[] = [];
    for (const contributor of contributors) {
      if (this.reachedGithubCallLimit) return null;
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
      commitAcitivity,
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
      databaseUser?.contributions,
      institutioName,
      orgName,
      repoName,
      contributor.contributions,
    );
    const newUser = await this.createNewUserObject(
      gitUser,
      contributionObject,
      orgName,
      databaseUser ? databaseUser.orgs : [],
    );
    if (!databaseUser) {
      await this.mongoService.createNewUser(newUser);
      return;
    }
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
    return this.githubService
      .get_User(userName)
      .then((gitUserResponse) => {
        this.logger.log(
          `Alredy made ${gitUserResponse.headers['x-ratelimit-used']}/${gitUserResponse.headers['x-ratelimit-limit']} calls.`,
        );
        this.writeRawResponseToFile(
          'get_github_user',
          institutionName,
          orgName,
          repoName,
          userName,
          gitUserResponse,
        );
        if (gitUserResponse?.status != 200) {
          this.logger.error(
            `Error while getting userdata from github from user ${userName}. Status is ${gitUserResponse.status}`,
          );
          return null;
        }
        return gitUserResponse.data as GithubUser;
      })
      .catch((error) => {
        this.logger.log(
          `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
        );
        if (
          parseInt(error.response.headers['x-ratelimit-used']) >=
          parseInt(error.response.headers['x-ratelimit-limit'])
        ) {
          this.reachedGithubCallLimit = true;
          return null;
        }
        this.logger.error(error);
        return null;
      });
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
    return this.githubService
      .get_Repository(owner, repoName)
      .then((gitRepoResponse) => {
        this.logger.log(
          `Alredy made ${gitRepoResponse.headers['x-ratelimit-used']}/${gitRepoResponse.headers['x-ratelimit-limit']} calls.`,
        );
        this.writeRawResponseToFile(
          'get_github_repo',
          institutionName,
          orgName,
          repoName,
          '',
          gitRepoResponse,
        );
        if (gitRepoResponse?.status != 200) {
          this.logger.error(
            `Error while getting repo data from github from repository ${repoName}. Status is ${gitRepoResponse.status}`,
          );
          return null;
        }
        return gitRepoResponse.data as GithubRepo;
      })
      .catch((error) => {
        this.logger.log(
          `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
        );
        if (
          parseInt(error.response.headers['x-ratelimit-used']) >=
          parseInt(error.response.headers['x-ratelimit-limit'])
        ) {
          this.reachedGithubCallLimit = true;
          return null;
        }
        this.logger.error(error);
        return null;
      });
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
    let response: GithubContributor[] = [];
    let page = 0;
    while (1) {
      const res: null | GithubContributor[] = await this.githubService
        .get_RepoContributors(owner, repoName, page)
        .then((gitRepoContributorsResponse) => {
          this.logger.log(
            `Alredy made ${gitRepoContributorsResponse.headers['x-ratelimit-used']}/${gitRepoContributorsResponse.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_contributors',
            institutionName,
            orgName,
            repoName,
            '',
            gitRepoContributorsResponse,
          );
          if (gitRepoContributorsResponse?.status != 200) {
            this.logger.error(
              `Error while getting contributors data from github from repository ${repoName}. Status is ${gitRepoContributorsResponse.status}`,
            );
            return null;
          }
          return gitRepoContributorsResponse.data as GithubContributor[];
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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
    let response: GithubCommit[] = [];
    let page = 0;
    while (1) {
      const res: null | GithubCommit[] = await this.githubService
        .get_RepoCommits(owner, repoName, page)
        .then((getRepoCommitsReponse) => {
          this.logger.log(
            `Alredy made ${getRepoCommitsReponse.headers['x-ratelimit-used']}/${getRepoCommitsReponse.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_commits',
            institutionName,
            orgName,
            repoName,
            '',
            getRepoCommitsReponse,
          );
          if (getRepoCommitsReponse?.status != 200) {
            this.logger.error(
              `Error while getting commit data from github from repository ${repoName}. Status is ${getRepoCommitsReponse.status}`,
            );
            return null;
          }
          return getRepoCommitsReponse.data as GithubCommit[];
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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
    let response: GitHubPull[] = [];
    let page = 0;
    while (1) {
      const res: null | GitHubPull[] = await this.githubService
        .get_RepoPulls(owner, repoName, state, page)
        .then((getRepoPullRequestsResponse) => {
          this.logger.log(
            `Alredy made ${getRepoPullRequestsResponse.headers['x-ratelimit-used']}/${getRepoPullRequestsResponse.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_pull_requests',
            institutionName,
            orgName,
            repoName,
            '',
            getRepoPullRequestsResponse,
          );
          if (getRepoPullRequestsResponse?.status != 200) {
            this.logger.error(
              `Error while getting pull request data from github from repository ${repoName}. Status is ${getRepoPullRequestsResponse.status}`,
            );
            return null;
          }
          return getRepoPullRequestsResponse.data as GitHubPull[];
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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
    let response: GitHubIssue[] = [];
    let page = 0;
    while (1) {
      const res: null | GitHubIssue[] = await this.githubService
        .get_RepoIssues(owner, repoName, state, page)
        .then((getRepoIssuesResponse) => {
          this.logger.log(
            `Alredy made ${getRepoIssuesResponse.headers['x-ratelimit-used']}/${getRepoIssuesResponse.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_issues',
            institutionName,
            orgName,
            repoName,
            '',
            getRepoIssuesResponse,
          );
          if (getRepoIssuesResponse?.status != 200) {
            this.logger.error(
              `Error while getting issues data from github from repository ${repoName}. Status is ${getRepoIssuesResponse.status}`,
            );
            return null;
          }
          return getRepoIssuesResponse.data as GitHubIssue[];
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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
    let response: GitHubCommitComment[] = [];
    let page = 0;
    while (1) {
      const res: null | GitHubCommitComment[] = await this.githubService
        .get_RepoCommitComments(owner, repoName, page)
        .then((getRepoCommitCommentsResult) => {
          this.logger.log(
            `Alredy made ${getRepoCommitCommentsResult.headers['x-ratelimit-used']}/${getRepoCommitCommentsResult.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_commit_comments',
            institutionName,
            orgName,
            repoName,
            '',
            getRepoCommitCommentsResult,
          );
          if (getRepoCommitCommentsResult?.status != 200) {
            this.logger.error(
              `Error while getting commit comments data from github from repository ${repoName}. Status is ${getRepoCommitCommentsResult.status}`,
            );
            return null;
          }
          return getRepoCommitCommentsResult.data as GitHubCommitComment[];
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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
    return this.githubService
      .get_RepoLanguages(owner, repoName)
      .then((getRepoLanguagesResult) => {
        this.logger.log(
          `Alredy made ${getRepoLanguagesResult.headers['x-ratelimit-used']}/${getRepoLanguagesResult.headers['x-ratelimit-limit']} calls.`,
        );
        this.writeRawResponseToFile(
          'get_github_langauges',
          institutionName,
          orgName,
          repoName,
          '',
          getRepoLanguagesResult,
        );
        if (getRepoLanguagesResult?.status != 200) {
          this.logger.error(
            `Error while getting commit comments data from github from repository ${repoName}. Status is ${getRepoLanguagesResult.status}`,
          );
          return null;
        }
        return getRepoLanguagesResult.data as Languages;
      })
      .catch((error) => {
        this.logger.log(
          `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
        );
        if (
          parseInt(error.response.headers['x-ratelimit-used']) >=
          parseInt(error.response.headers['x-ratelimit-limit'])
        ) {
          this.reachedGithubCallLimit = true;
          return null;
        }
        this.logger.error(error);
        return null;
      });
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
      const res = await this.githubService
        .get_RepoCommitActivity(owner, repoName)
        .then((res) => {
          getRepoCommitActivityResult = res;
          this.logger.log(
            `Alredy made ${res.headers['x-ratelimit-used']}/${res.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_commit_acitivity',
            institutionName,
            orgName,
            repoName,
            '',
            res,
          );
          return res;
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      getRepoCommitActivityResult = res as OctokitResponse<any>;
      if ((getRepoCommitActivityResult.status = 200)) {
        return getRepoCommitActivityResult.data as GithubCommitActivity[];
      }
    }
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
    return this.githubService
      .get_Organisation(orgName)
      .then((getOrganisationResult) => {
        this.logger.log(
          `Alredy made ${getOrganisationResult.headers['x-ratelimit-used']}/${getOrganisationResult.headers['x-ratelimit-limit']} calls.`,
        );
        this.writeRawResponseToFile(
          'get_github_organisation',
          institutionName,
          orgName,
          '',
          '',
          getOrganisationResult,
        );
        if (getOrganisationResult?.status != 200) {
          this.logger.error(
            `Error while getting organisation data from github from the organisation ${orgName}. Status is ${getOrganisationResult.status}`,
          );
          return null;
        }
        return getOrganisationResult.data as GithubOrganisation;
      })
      .catch((error) => {
        this.logger.log(
          `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
        );
        if (
          parseInt(error.response.headers['x-ratelimit-used']) >=
          parseInt(error.response.headers['x-ratelimit-limit'])
        ) {
          this.reachedGithubCallLimit = true;
          return null;
        }
        this.logger.error(error);
        return null;
      });
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
    let response: GithubOrganisationMember[] = [];
    let page = 0;
    while (1) {
      const res: null | GithubOrganisationMember[] = await this.githubService
        .get_OrganisationMembers(orgName, page)
        .then((getOrganisationMembersResult) => {
          this.logger.log(
            `Alredy made ${getOrganisationMembersResult.headers['x-ratelimit-used']}/${getOrganisationMembersResult.headers['x-ratelimit-limit']} calls.`,
          );
          this.writeRawResponseToFile(
            'get_github_organisation_members',
            institutionName,
            orgName,
            '',
            '',
            getOrganisationMembersResult,
          );
          if (getOrganisationMembersResult?.status != 200) {
            this.logger.error(
              `Error while getting organisation members data from github from the organisation ${orgName}. Status is ${getOrganisationMembersResult.status}`,
            );
            return null;
          }
          return getOrganisationMembersResult.data as GithubOrganisationMember[];
        })
        .catch((error) => {
          this.logger.log(
            `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
          );
          if (
            parseInt(error.response.headers['x-ratelimit-used']) >=
            parseInt(error.response.headers['x-ratelimit-limit'])
          ) {
            this.reachedGithubCallLimit = true;
            return null;
          }
          this.logger.error(error);
          return null;
        });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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

    let response: GithubOrganisationRepository[] = [];
    let page = 0;
    while (1) {
      const res: null | GithubOrganisationRepository[] =
        await this.githubService
          .get_OrganisationRepositories(orgName, page)
          .then((getOrganisationRepositoriesResult) => {
            this.logger.log(
              `Alredy made ${getOrganisationRepositoriesResult.headers['x-ratelimit-used']}/${getOrganisationRepositoriesResult.headers['x-ratelimit-limit']} calls.`,
            );
            this.writeRawResponseToFile(
              'get_github_organisation_repositories',
              institutionName,
              orgName,
              '',
              '',
              getOrganisationRepositoriesResult,
            );
            if (getOrganisationRepositoriesResult?.status != 200) {
              this.logger.error(
                `Error while getting organisation repositories data from github from the organisation ${orgName}. Status is ${getOrganisationRepositoriesResult.status}`,
              );
              return null;
            }
            return getOrganisationRepositoriesResult.data as GithubOrganisationRepository[];
          })
          .catch((error) => {
            this.logger.log(
              `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
            );
            if (
              parseInt(error.response.headers['x-ratelimit-used']) >=
              parseInt(error.response.headers['x-ratelimit-limit'])
            ) {
              this.reachedGithubCallLimit = true;
              return null;
            }
            this.logger.error(error);
            return null;
          });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
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
    return this.githubService
      .compare_Commits(
        owner,
        repoName,
        parentOwner,
        parentDefaultBranch,
        defaultBranch,
      )
      .then((compareTwoCommitsResult) => {
        this.logger.log(
          `Alredy made ${compareTwoCommitsResult.headers['x-ratelimit-used']}/${compareTwoCommitsResult.headers['x-ratelimit-limit']} calls.`,
        );
        this.writeRawResponseToFile(
          'compare_github_commits',
          institutionName,
          orgName,
          repoName,
          '',
          compareTwoCommitsResult,
        );
        if (compareTwoCommitsResult?.status != 200) {
          this.logger.error(
            `Error while comparing :${defaultBranch} and ${parentOwner}:${parentDefaultBranch}. Status is ${compareTwoCommitsResult.status}`,
          );
          return null;
        }
        return compareTwoCommitsResult.data as GithubCommitComparison;
      })
      .catch((error) => {
        this.logger.log(
          `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
        );
        if (
          parseInt(error.response.headers['x-ratelimit-used']) >=
          parseInt(error.response.headers['x-ratelimit-limit'])
        ) {
          this.reachedGithubCallLimit = true;
          return null;
        }
        this.logger.error(error);
        return null;
      });
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
    const databaseUser = await this.mongoService.findUserWithUserName(userName);
    if (!databaseUser) return null;
    return databaseUser;
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
    if (!savedOrgs.includes(orgName)) savedOrgs.push(orgName);
    const newUser: User = {
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
   * Create a new contribution aboject
   * @param dbContributions The contributions object from the database user
   * @param institutionName The name of the current institution
   * @param orgName The name of the organisation
   * @param repoName The name of the repository
   * @param numberOfContributions The number of contributions this user has made to this repo
   * @returns The new contribution object
   */
  private async createContributionObject(
    dbContributions: Contributions,
    institutionName: string,
    orgName: string,
    repoName: string,
    numberOfContributions: number,
  ): Promise<Contributions> {
    const repoContribution: RepositoryContributions = {
      [repoName]: numberOfContributions,
    };
    const orgContribution: OrganisationContributions = {
      [orgName]: repoContribution,
    };
    const contribution: Contributions = { [institutionName]: orgContribution };
    if (!dbContributions) return contribution;
    if (!dbContributions[institutionName]) {
      Object.assign(dbContributions, contribution);
    } else if (!dbContributions[institutionName][orgName]) {
      Object.assign(
        dbContributions[institutionName],
        contribution[institutionName],
      );
    } else if (!dbContributions[institutionName][orgName][repoName]) {
      Object.assign(
        dbContributions[institutionName][orgName],
        contribution[institutionName][orgName],
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
    const coders: string[] = [];
    for (const commit of commits) {
      if (!commit.author) continue;
      if (coders.includes(commit.author.login)) continue;
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
    commitAcitivity: GithubCommitActivity[],
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
      commit_activities: commitAcitivity,
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
   * @param orgName The name of the organisation
   * @returns A Organisation Object
   */
  private async createOrganisationObject(
    organisation: GithubOrganisation,
    memberCount: number,
    orgName: string,
  ): Promise<Organisation> {
    const newOrg: Organisation = {
      num_repos: organisation.public_repos,
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
      name: orgName,
      url: organisation.html_url,
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
   * Update a organisation Object
   * @param organisation A Github Organisation Object
   * @param memberCount The number of members in the organisation
   * @returns A Organisation Object
   */
  private async updateOrganisationObject(
    dbOrganisation: Organisation,
    organisation: GithubOrganisation,
    memberCount: number,
  ): Promise<Organisation> {
    const newOrg: Organisation = {
      num_repos: dbOrganisation.num_repos + organisation.public_repos,
      num_members: dbOrganisation.num_members + memberCount,
      total_num_contributors: dbOrganisation.total_num_contributors,
      total_num_own_repo_forks: dbOrganisation.total_num_own_repo_forks,
      total_num_forks_in_repos: dbOrganisation.total_num_forks_in_repos,
      total_num_commits: dbOrganisation.total_num_commits,
      total_pull_requests: dbOrganisation.total_pull_requests,
      total_issues: dbOrganisation.total_issues,
      total_num_stars: dbOrganisation.total_num_stars,
      total_num_watchers: dbOrganisation.total_num_watchers,
      total_pull_requests_all: dbOrganisation.total_pull_requests_all,
      total_pull_requests_closed: dbOrganisation.total_pull_requests_closed,
      total_issues_all: dbOrganisation.total_issues_all,
      total_issues_closed: dbOrganisation.total_issues_closed,
      total_comments: dbOrganisation.total_comments,
      name: dbOrganisation.name,
      url: dbOrganisation.url,
      description: dbOrganisation.description,
      avatar: dbOrganisation.avatar,
      created_at: dbOrganisation.created_at,
      location: dbOrganisation.location,
      email: dbOrganisation.email,
      repos: dbOrganisation.repos,
      repo_names: dbOrganisation.repo_names,
      total_licenses: dbOrganisation.total_licenses,
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
    organisation: Organisation,
    repository: Repository,
  ): Promise<Organisation> {
    if (repository.fork) {
      organisation.total_num_forks_in_repos++;
      organisation.total_num_commits += repository.has_own_commits;
    } else {
      organisation.total_num_stars += repository.num_stars;
      organisation.total_num_contributors += repository.num_contributors;
      organisation.total_num_commits += repository.num_commits;
      organisation.total_num_own_repo_forks += repository.num_forks;
      organisation.total_num_watchers += repository.num_watchers;
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

  /**
   * Create a institution object   * @param todoInstitution The TodoInstitution object of this institution
   * @param institutionSector The institution sector
   * @returns A institution object
   */
  private async createInstitutionObject(
    todoInstitution: TodoInstitution,
    institutionSector: string,
  ): Promise<Institution> {
    const institution: Institution = {
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
      sector: institutionSector,
      stats: [],
      searchString: '',
    };
    return institution;
  }

  /**
   * Create a new Statistics object
   * @param institution A institution object
   * @returns The statistic object
   */
  private async createStatistics(institution: Institution): Promise<Statistic> {
    const stats: Statistic = {
      timestamp: new Date(),
      num_repos: institution.num_repos,
      num_members: institution.num_members,
      total_num_contributors: institution.total_num_contributors,
      total_num_own_repo_forks: institution.total_num_own_repo_forks,
      total_num_forks_in_repos: institution.total_num_forks_in_repos,
      total_num_commits: institution.total_num_commits,
      total_pull_requests: institution.total_pull_requests,
      total_issues: institution.total_issues,
      total_num_stars: institution.total_num_stars,
      total_num_watchers: institution.total_num_watchers,
      total_commits_last_year: 0, // TODO - find this value
      total_pull_requests_all: institution.total_pull_requests_all,
      total_pull_requests_closed: institution.total_pull_requests_closed,
      total_issues_all: institution.total_issues_all,
      total_issues_closed: institution.total_issues_closed,
      total_comments: institution.total_comments,
    };
    return stats;
  }

  /**
   * Update the institution with new organisation data
   * @param organisation The organisation data to update with
   * @param institution The institution data to be updated
   * @returns The updated institution
   */
  private async updateInstitutionWithOrgData(
    organisation: Organisation,
    institution: Institution,
  ): Promise<Institution> {
    institution.orgs.push(organisation);
    institution.num_orgs += 1;
    institution.num_members += organisation.num_members;
    institution.num_repos += organisation.num_repos;
    institution.avatar.push(organisation.avatar);
    institution.org_names.push(organisation.name);
    institution.total_num_stars += organisation.total_num_stars;
    institution.total_num_contributors += organisation.total_num_contributors;
    institution.total_num_commits += organisation.total_num_commits;
    institution.total_num_own_repo_forks +=
      organisation.total_num_own_repo_forks;
    institution.total_num_watchers += organisation.total_num_watchers;
    institution.total_pull_requests_all += organisation.total_pull_requests_all;
    institution.total_pull_requests_closed +=
      organisation.total_pull_requests_closed;
    institution.total_issues_all += organisation.total_issues_all;
    institution.total_issues_closed += organisation.total_issues_closed;
    institution.total_comments += organisation.total_comments;
    institution.repos = institution.repo_names.concat(organisation.repos);
    institution.repo_names = institution.repo_names.concat(
      organisation.repo_names,
    );

    return institution;
  }

  /**
   * Writes a git response to a file
   * @param method The github method used
   * @param institutionName The name of the institution
   * @param orgName The organisation Name
   * @param repoName The name of the repository
   * @param userName The name of the user
   * @param response The response object
   */
  private async writeRawResponseToFile(
    method: string,
    institutionName: string,
    orgName?: string,
    repoName?: string,
    userName?: string,
    response?: OctokitResponse<any>,
  ): Promise<void> {
    if (!fs.existsSync(this.logPath)) await fs.mkdirSync(this.logPath);
    const rawResponse: RawResponse = {
      method: method,
      ts: new Date(),
      institutionName: institutionName,
      orgName: orgName,
      repoName: repoName,
      userName: userName,
      response: response,
    };
    await fs.writeFileSync(
      `${this.logPath}/raw_git_response_${rawResponse.ts.getTime()}.json`,
      JSON.stringify(rawResponse),
    );
  }
}
