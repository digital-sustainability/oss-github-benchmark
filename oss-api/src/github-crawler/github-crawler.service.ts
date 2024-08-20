import { Injectable, Logger } from '@nestjs/common';
import {
  GitHubCommitComment,
  GitHubIssue,
  GitHubPull,
  GithubCommit,
  GithubContributor,
  GithubOrganisationMember,
  GithubOrganisationRepository,
  GithubRepo,
  Institution,
  Method,
  RawResponse,
  TodoInstitution,
  TodoOrganisation,
} from '../interfaces';
import { GithubService } from '../github/github.service';
import { OctokitResponse } from '@octokit/types';
import * as fs from 'fs';
import { MongoDbService } from '../mongo-db/mongo-db.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class GithubCrawlerService {
  constructor(
    private githubService: GithubService,
    private mongo: MongoDbService,
    private telemetryService: TelemetryService,
  ) {
    this.dataPath = process.env.DATA_PATH;
  }

  private readonly logger = new Logger(GithubCrawlerService.name);
  private reachedGithubCallLimit: boolean;
  private dataPath: string;
  private daysToWait = 7 * 24 * 60 * 60 * 1000; // Days * 24 hours * 60 minutes * 60 seconds * 1000 miliseconds

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async onApplicationBootstrap() {}

  private sortAfterDate(
    a: TodoInstitution | TodoOrganisation,
    b: TodoInstitution | TodoOrganisation,
  ) {
    if (!a.ts && !b.ts) return 0;
    if (!a.ts) return -1;
    if (!b.ts) return 1;
    try {
      return b.ts.getTime() - a.ts.getTime();
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  /**
   * Prepare all the institution data
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async prepareInstitutions() {
    this.logger.log(`Prepairing all institutions to be crawled`);
    this.reachedGithubCallLimit = false;
    const todoInstituitions = await this.mongo.findAllTodoInstitutions();
    todoInstituitions.sort((a, b) => this.sortAfterDate(a, b));
    for (const todoInstituition of todoInstituitions) {
      if (this.reachedGithubCallLimit) break;
      if (
        todoInstituition.ts &&
        todoInstituition.ts.getTime() > Date.now() - this.daysToWait
      ) {
        this.logger.log(
          `The institution ${todoInstituition.name_de} was alredy crawled in the last defined time`,
        );
        continue;
      }
      await this.handleInstitution(todoInstituition);
      if (this.reachedGithubCallLimit) break;
      await this.mongo.updateTodoInstitutionTimestamp(todoInstituition.uuid);
    }
    this.updateTelemetry();
    this.logger.log('Crawler finished');
  }

  /**
   * Handle the institution data
   * @param institution The insitution data
   */
  private async handleInstitution(institution: TodoInstitution): Promise<void> {
    // this.logger.log(`Handling institution ${institution.name_de}`);
    institution.orgs.sort((a, b) => this.sortAfterDate(a, b));
    for (const [index, organisation] of institution.orgs.entries()) {
      if (this.reachedGithubCallLimit) break;
      if (organisation.ts?.getTime() > Date.now() - this.daysToWait) {
        this.logger.log(
          `The organisation ${organisation.name} was alredy crawled in the last defined time`,
        );
        continue;
      }
      await this.handleOrganisation(organisation.name, institution.shortname);
      if (this.reachedGithubCallLimit) break;
      organisation.ts = new Date();
      institution.orgs[index] = organisation;
      await this.mongo.updateOrgTimestamp(institution);
    }
  }

  /**
   * Handle all organisation data
   * @param orgName The organisation name
   * @param institutionName The institution name
   * @returns Void
   */
  private async handleOrganisation(
    orgName: string,
    institutionName: string,
  ): Promise<void> {
    // this.logger.log(`Handling organisation ${orgName}`);
    await this.getGitHubOrganisation(institutionName, orgName);
    await this.getGithubOrganisationMembers(orgName, institutionName);
    const repositories = await this.getGitHubOrganisationRepositories(
      orgName,
      institutionName,
    );
    if (!repositories) return null;
    for (const repository of repositories) {
      if (this.reachedGithubCallLimit) return;
      await this.handleRepository(repository, institutionName, orgName);
    }
    return;
  }

  /**
   * Handle the repository data
   * @param repo The repository objext
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Void
   */
  private async handleRepository(
    repo: GithubOrganisationRepository,
    institutionName: string,
    orgName: string,
  ): Promise<void> {
    // this.logger.log(`Handling repository ${repo.name}`);
    const dbRepository = await this.mongo.findRepository(
      repo.name,
      institutionName,
    );
    if (
      dbRepository &&
      dbRepository.timestamp.getTime() > Date.now() - this.daysToWait
    ) {
      return;
    }
    const gitRepository = await this.getGitHubRepository(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!gitRepository) return;
    const contributors = await this.getGitHubRepositoryContibutors(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (!contributors) return;
    await this.getGitHubRepositoryCommits(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    await this.getGitHubPullRequests(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'all',
    );
    await this.getGitHubPullRequests(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'closed',
    );
    await this.getGitHubIssues(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'all',
    );
    await this.getGitHubIssues(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
      'closed',
    );
    await this.getGitHubRepoCommitComments(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    await this.getGitHubRepoLanguages(
      repo.name,
      repo.owner.login,
      institutionName,
      orgName,
    );
    if (gitRepository.parent) {
      await this.compareTwoGitHubCommits(
        repo.name,
        repo.owner.login,
        institutionName,
        orgName,
        gitRepository.parent.owner.login,
        gitRepository.source.default_branch,
        gitRepository.default_branch,
      );
    }
    for (const contributor of contributors) {
      if (this.reachedGithubCallLimit) return;
      await this.handleContributorData(
        contributor,
        repo.name,
        orgName,
        institutionName,
      );
    }
  }

  /**
   * Handle all the contributor Data
   * @param contributor The contributor object
   * @param repoName The repository name
   * @param orgName The organisation name
   * @param institutioName The institution name
   */
  private async handleContributorData(
    contributor: GithubContributor,
    repoName: string,
    orgName: string,
    institutioName: string,
  ): Promise<void> {
    // this.logger.log(`Handling Contributor ${contributor.login}`);
    await this.getGitHubUser(
      contributor.login,
      institutioName,
      orgName,
      repoName,
    );
  }

  /******************************************Helper Functions*******************************************************/

  /**
   * Write a github response to a json file
   * @param method The method calling
   * @param institutionName The name of the institution
   * @param type The type of the data
   * @param orgName The name of the organisation
   * @param repoName The name of the repository
   * @param userName The name of the user
   * @param response The github response
   */
  private async writeRawResponseToFile(
    method: string,
    institutionName: string,
    type: 'user' | 'repository' | 'organisation',
    orgName?: string,
    repoName?: string,
    userName?: string,
    response?: OctokitResponse<any>,
  ): Promise<void> {
    // this.logger.log(`Writing a github file of the type ${type}`);
    if (!fs.existsSync(this.dataPath)) await fs.mkdirSync(this.dataPath);
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
      `${this.dataPath}/${type}_${rawResponse.ts.getTime()}.json`,
      JSON.stringify(rawResponse),
    );
  }

  /**
   * Get all the data of an user
   * @param userName The name of the user
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param repoName The name of the repository
   */
  private async getGitHubUser(
    userName: string,
    institutionName: string,
    orgName: string,
    repoName: string,
  ): Promise<void> {
    // this.logger.log(`Getting userdata from github from user ${userName}`);
    await this.githubService
      .get_User(userName)
      .then((gitUserResponse) => {
        this.logger.log(
          `Alredy made ${gitUserResponse.headers['x-ratelimit-used']}/${gitUserResponse.headers['x-ratelimit-limit']} calls.`,
        );
        if (gitUserResponse?.status != 200) {
          this.logger.error(
            `Error while getting userdata from github from user ${userName}. Status is ${gitUserResponse.status}`,
          );
        }
        this.writeRawResponseToFile(
          Method.User,
          institutionName,
          'user',
          orgName,
          repoName,
          userName,
          gitUserResponse,
        );
        this.telemetryService.incrementOkStatus();
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
          console.log(
            'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
          );
        }
        this.logger.error(error);
        this.telemetryService.incrementErrorStatus();
      });
  }

  /**
   * Get all the repository data
   * @param repoName The name of the repository
   * @param owner The name of the owner
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null if an error occured or the repo data
   */
  private async getGitHubRepository(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubRepo> {
    // this.logger.log(`Getting all the data from the repository ${repoName}`);
    return this.githubService
      .get_Repository(owner, repoName)
      .then((gitRepoResponse) => {
        // this.logger.log(
        //   `Alredy made ${gitRepoResponse.headers['x-ratelimit-used']}/${gitRepoResponse.headers['x-ratelimit-limit']} calls.`,
        // );
        if (gitRepoResponse?.status != 200) {
          this.logger.error(
            `Error while getting repo data from github from repository ${repoName}. Status is ${gitRepoResponse.status}`,
          );
          return null;
        }
        this.writeRawResponseToFile(
          Method.Repository,
          institutionName,
          'repository',
          orgName,
          repoName,
          '',
          gitRepoResponse,
        );
        this.telemetryService.incrementOkStatus();
        return gitRepoResponse.data as GithubRepo;
      })
      .catch((error) => {
        // this.logger.log(
        //   `Alredy made ${error.response.headers['x-ratelimit-used']}/${error.response.headers['x-ratelimit-limit']} calls.`,
        // );
        if (
          parseInt(error.response.headers['x-ratelimit-used']) >=
          parseInt(error.response.headers['x-ratelimit-limit'])
        ) {
          this.reachedGithubCallLimit = true;
          console.log(
            'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
          );
        }
        this.logger.error(error);
        this.telemetryService.incrementErrorStatus();
        return null;
      });
  }

  /**
   * Get all the contributors of the repository
   * @param repoName The name of the repository
   * @param owner The owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Null if an error occured or an array with all contributors
   */
  private async getGitHubRepositoryContibutors(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<null | GithubContributor[]> {
    // this.logger.log(
    //   `Getting all the contributors from the repository ${repoName}`,
    // );
    let response: GithubContributor[] = [];
    let page = 0;
    while (1) {
      const res: null | GithubContributor[] = await this.githubService
        .get_RepoContributors(owner, repoName, page)
        .then((gitRepoContributorsResponse) => {
          // this.logger.log(
          //   `Alredy made ${gitRepoContributorsResponse.headers['x-ratelimit-used']}/${gitRepoContributorsResponse.headers['x-ratelimit-limit']} calls.`,
          // );
          if (gitRepoContributorsResponse?.status != 200) {
            this.logger.error(
              `Error while getting contributors data from github from repository ${repoName}. Status is ${gitRepoContributorsResponse.status}`,
            );
            return null;
          }
          this.writeRawResponseToFile(
            Method.Contributor,
            institutionName,
            'repository',
            orgName,
            repoName,
            '',
            gitRepoContributorsResponse,
          );
          this.telemetryService.incrementOkStatus();
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
            console.log(
              'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
            );
            return;
          }
          this.logger.error(error);
          this.telemetryService.incrementErrorStatus();
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
   * Get all commits from repository
   * @param repoName The name of the repository
   * @param owner The owner of the repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Void
   */
  private async getGitHubRepositoryCommits(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<void> {
    // this.logger.log(`Getting all the commits from the repository ${repoName}`);
    let page = 0;
    while (1) {
      const res: void | GithubCommit[] = await this.githubService
        .get_RepoCommits(owner, repoName, page)
        .then((getRepoCommitsReponse) => {
          this.logger.log(
            `Alredy made ${getRepoCommitsReponse.headers['x-ratelimit-used']}/${getRepoCommitsReponse.headers['x-ratelimit-limit']} calls.`,
          );
          if (getRepoCommitsReponse?.status != 200) {
            this.logger.error(
              `Error while getting commit data from github from repository ${repoName}. Status is ${getRepoCommitsReponse.status}`,
            );
            return;
          }
          this.writeRawResponseToFile(
            Method.Commit,
            institutionName,
            'repository',
            orgName,
            repoName,
            '',
            getRepoCommitsReponse,
          );
          this.telemetryService.incrementOkStatus();
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
            console.log(
              'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
            );
          }
          this.logger.error(error);
          this.telemetryService.incrementErrorStatus();
          return;
        });
      if (!res) return;
      if (res.length < 100) break;
      page++;
    }
  }

  /**
   * Get all the pull requests from a repository
   * @param repoName The name of the repository
   * @param owner The name of the owner
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param state The state of the pull request
   */
  private async getGitHubPullRequests(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
    state: 'all' | 'open' | 'closed',
  ): Promise<void> {
    // this.logger.log(
    //   `Getting all the pull requests with the state ${state} from the repository ${repoName}`,
    // );
    let page = 0;
    while (1) {
      const res: null | GitHubPull[] = await this.githubService
        .get_RepoPulls(owner, repoName, state, page)
        .then((getRepoPullRequestsResponse) => {
          this.logger.log(
            `Alredy made ${getRepoPullRequestsResponse.headers['x-ratelimit-used']}/${getRepoPullRequestsResponse.headers['x-ratelimit-limit']} calls.`,
          );
          if (getRepoPullRequestsResponse?.status != 200) {
            this.logger.error(
              `Error while getting pull request data from github from repository ${repoName}. Status is ${getRepoPullRequestsResponse.status}`,
            );
            return null;
          }
          this.writeRawResponseToFile(
            state == 'all' ? Method.PullRequestAll : Method.PullRequestClosed,
            institutionName,
            'repository',
            orgName,
            repoName,
            '',
            getRepoPullRequestsResponse,
          );
          this.telemetryService.incrementOkStatus();
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
            console.log(
              'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
            );
          }
          this.logger.error(error);
          this.telemetryService.incrementErrorStatus();
          return null;
        });
      if (!res) break;
      if (res.length < 100) break;
      page++;
    }
  }

  /**
   * Get all the issues of the repository
   * @param repoName The name of the repository
   * @param owner The name of the owner
   * @param institutionName The name of the insitution
   * @param orgName The name of the name of the organisation
   * @param state The state of the of the issue
   * @returns Void
   */
  private async getGitHubIssues(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
    state: 'all' | 'open' | 'closed',
  ): Promise<void> {
    // this.logger.log(
    //   `Getting all the issues with the state ${state} from the repository ${repoName}`,
    // );
    let page = 0;
    while (1) {
      const res: null | GitHubIssue[] = await this.githubService
        .get_RepoIssues(owner, repoName, state, page)
        .then((getRepoIssuesResponse) => {
          this.logger.log(
            `Alredy made ${getRepoIssuesResponse.headers['x-ratelimit-used']}/${getRepoIssuesResponse.headers['x-ratelimit-limit']} calls.`,
          );
          if (getRepoIssuesResponse?.status != 200) {
            this.logger.error(
              `Error while getting issues data from github from repository ${repoName}. Status is ${getRepoIssuesResponse.status}`,
            );
            return null;
          }
          this.writeRawResponseToFile(
            state == 'all' ? Method.IssueAll : Method.IssueClosed,
            institutionName,
            'repository',
            orgName,
            repoName,
            '',
            getRepoIssuesResponse,
          );
          this.telemetryService.incrementOkStatus();
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
            console.log(
              'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
            );
          }
          this.logger.error(error);
          this.telemetryService.incrementErrorStatus();
          return null;
        });
      if (!res) return null;
      if (res.length < 100) break;
      page++;
    }
  }

  /**
   * Get all the comments of the commits
   * @param repoName The name of the repository
   * @param owner The name of the owner
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Void
   */
  private async getGitHubRepoCommitComments(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<void> {
    // this.logger.log(
    //   `Getting all the commit comments from the repository ${repoName}`,
    // );
    let page = 0;
    while (1) {
      const res: null | GitHubCommitComment[] = await this.githubService
        .get_RepoCommitComments(owner, repoName, page)
        .then((getRepoCommitCommentsResult) => {
          this.logger.log(
            `Alredy made ${getRepoCommitCommentsResult.headers['x-ratelimit-used']}/${getRepoCommitCommentsResult.headers['x-ratelimit-limit']} calls.`,
          );
          if (getRepoCommitCommentsResult?.status != 200) {
            this.logger.error(
              `Error while getting commit comments data from github from repository ${repoName}. Status is ${getRepoCommitCommentsResult.status}`,
            );
            return null;
          }
          this.writeRawResponseToFile(
            Method.Comment,
            institutionName,
            'repository',
            orgName,
            repoName,
            '',
            getRepoCommitCommentsResult,
          );
          this.telemetryService.incrementOkStatus();
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
            console.log(
              'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
            );
          }
          this.logger.error(error);
          this.telemetryService.incrementErrorStatus();
          return null;
        });
      if (!res) return null;
      if (res.length < 100) break;
      page++;
    }
  }

  /**
   * Get the programming languges of the repository
   * @param repoName The name of the repository
   * @param owner The name of the owner
   * @param institutionName The name of the instituion
   * @param orgName The name of the organisation
   */
  private async getGitHubRepoLanguages(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
  ): Promise<void> {
    // this.logger.log(
    //   `Getting all the programming languages from the repository ${repoName}`,
    // );
    await this.githubService
      .get_RepoLanguages(owner, repoName)
      .then((getRepoLanguagesResult) => {
        this.logger.log(
          `Alredy made ${getRepoLanguagesResult.headers['x-ratelimit-used']}/${getRepoLanguagesResult.headers['x-ratelimit-limit']} calls.`,
        );
        if (getRepoLanguagesResult?.status != 200) {
          this.logger.error(
            `Error while getting commit comments data from github from repository ${repoName}. Status is ${getRepoLanguagesResult.status}`,
          );
          return;
        }
        this.writeRawResponseToFile(
          Method.Language,
          institutionName,
          'repository',
          orgName,
          repoName,
          '',
          getRepoLanguagesResult,
        );
        this.telemetryService.incrementOkStatus();
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
          console.log(
            'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
          );
        }
        this.logger.error(error);
        this.telemetryService.incrementErrorStatus();
        return;
      });
  }

  /**
   * Compare two commits two know which is newer
   * @param repoName The name of the repository
   * @param owner The owner of that repository
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @param parentOwner The owner of the parent repo
   * @param parentDefaultBranch The name of the default branch in the parent repository
   * @param defaultBranch The name of the default branch in the repository
   */
  private async compareTwoGitHubCommits(
    repoName: string,
    owner: string,
    institutionName: string,
    orgName: string,
    parentOwner: string,
    parentDefaultBranch: string,
    defaultBranch: string,
  ): Promise<void> {
    // this.logger.log(
    //   `Comparing two commits between :${defaultBranch} and ${parentOwner}:${parentDefaultBranch}.`,
    // );
    await this.githubService
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
        if (compareTwoCommitsResult?.status != 200) {
          this.logger.error(
            `Error while comparing :${defaultBranch} and ${parentOwner}:${parentDefaultBranch}. Status is ${compareTwoCommitsResult.status}`,
          );
          return;
        }
        this.writeRawResponseToFile(
          Method.CompareCommit,
          institutionName,
          'repository',
          orgName,
          repoName,
          '',
          compareTwoCommitsResult,
        );
        this.telemetryService.incrementOkStatus();
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
          console.log(
            'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
          );
        }
        this.logger.error(error);
        this.telemetryService.incrementErrorStatus();
        return;
      });
  }

  /**
   * Get the organisation data from Github
   * @param institutionName The name of the institution
   * @param orgName The name of the organisation
   * @returns Void
   */
  private async getGitHubOrganisation(
    institutionName: string,
    orgName: string,
  ): Promise<void> {
    // this.logger.log(`Getting all the data of the organisation ${orgName}`);
    return this.githubService
      .get_Organisation(orgName)
      .then((getOrganisationResult) => {
        this.logger.log(
          `Alredy made ${getOrganisationResult.headers['x-ratelimit-used']}/${getOrganisationResult.headers['x-ratelimit-limit']} calls.`,
        );
        if (getOrganisationResult?.status != 200) {
          this.logger.error(
            `Error while getting organisation data from github from the organisation ${orgName}. Status is ${getOrganisationResult.status}`,
          );
          return;
        }
        this.writeRawResponseToFile(
          Method.Organisation,
          institutionName,
          'organisation',
          orgName,
          '',
          '',
          getOrganisationResult,
        );
        this.telemetryService.incrementOkStatus();
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
          console.log(
            'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
          );
        }
        this.logger.error(error);
        this.telemetryService.incrementErrorStatus();
        return;
      });
  }

  /**
   * Get all the members of an organisation
   * @param orgName The name of the organisation
   * @param institutionName The name of the institution
   * @returns Void
   */
  private async getGithubOrganisationMembers(
    orgName: string,
    institutionName: string,
  ): Promise<void> {
    // this.logger.log(`Getting all the members of the organisation ${orgName}`);
    const response: GithubOrganisationMember[] = [];
    let page = 0;
    while (1) {
      const res: null | GithubOrganisationMember[] = await this.githubService
        .get_OrganisationMembers(orgName, page)
        .then((getOrganisationMembersResult) => {
          this.logger.log(
            `Alredy made ${getOrganisationMembersResult.headers['x-ratelimit-used']}/${getOrganisationMembersResult.headers['x-ratelimit-limit']} calls.`,
          );
          if (getOrganisationMembersResult?.status != 200) {
            this.logger.error(
              `Error while getting organisation members data from github from the organisation ${orgName}. Status is ${getOrganisationMembersResult.status}`,
            );
            return null;
          }
          this.writeRawResponseToFile(
            Method.Member,
            institutionName,
            'organisation',
            orgName,
            '',
            '',
            getOrganisationMembersResult,
          );
          this.telemetryService.incrementOkStatus();
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
            console.log(
              'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
            );
          }
          this.logger.error(error);
          this.telemetryService.incrementErrorStatus();
          return null;
        });
      if (!res) return;
      if (res.length < 100) return;
      page++;
    }
  }

  /**
   * Get all the repositories of a given organisation
   * @param orgName The name of the organisation
   * @param institutionName The name of the insitution
   * @returns Null if an error occured or an array with gith github organisations
   */
  private async getGitHubOrganisationRepositories(
    orgName: string,
    institutionName: string,
  ): Promise<null | GithubOrganisationRepository[]> {
    // this.logger.log(
    //   `Getting all the repositories of the organisation ${orgName}`,
    // );
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
            if (getOrganisationRepositoriesResult?.status != 200) {
              this.logger.error(
                `Error while getting organisation repositories data from github from the organisation ${orgName}. Status is ${getOrganisationRepositoriesResult.status}`,
              );
              return null;
            }
            this.writeRawResponseToFile(
              Method.OrganisationRepository,
              institutionName,
              'organisation',
              orgName,
              '',
              '',
              getOrganisationRepositoriesResult,
            );
            this.telemetryService.incrementOkStatus();
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
              console.log(
                'Ratelimit is reached. ause Crawling until Github-Api allows new calls (at xx.00)',
              );
            }
            this.logger.error(error);
            this.telemetryService.incrementErrorStatus();
            return null;
          });
      if (!res) return null;
      response = response.concat(res);
      if (res.length < 100) break;
      page++;
    }
    return response;
  }

  private async updateTelemetry() {
    // this.logger.log('Updating Telemetry data');
    const condition: Object[] = [
      {
        fork: { $in: [true, false] },
      },
    ];
    const countedRepos = await this.mongo.countAllRepositoriesWithConditions(
      condition,
    );
    const latestUpdate = (await this.mongo.latestUpdate())[0];
    const latestDate = new Date(latestUpdate.updatedDate).getTime();
    this.telemetryService.setRepoCount(countedRepos[0].total);
    this.telemetryService.setLatestCrawl(latestDate);
  }
}
