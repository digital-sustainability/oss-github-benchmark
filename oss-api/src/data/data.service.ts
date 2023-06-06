import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import {
  GitHubCommitComment,
  GitHubIssue,
  GitHubPull,
  GithubCommit,
  GithubCommitActivity,
  GithubCommitComparison,
  GithubContributor,
  GithubOrganisation,
  GithubRepo,
  Languages,
  Method,
  OrganisationRevised,
  RawResponse,
  RepositoryRevised,
  RepositoryStats,
} from '../interfaces';
import { GithubUser } from '../interfaces';
import { Contributor } from '../interfaces';
import { MongoDbService } from '../mongo-db/mongo-db.service';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

interface RepoData {
  repository: GithubRepo;
  contributors: GithubContributor[];
  commits: GithubCommit[];
  allPulls: GitHubPull[];
  closedPulls: GitHubPull[];
  allIssues: GitHubIssue[];
  closedIssues: GitHubIssue[];
  commitComments: GitHubCommitComment[];
  languages: Languages;
  commitActivity: GithubCommitActivity[];
  comparedCommits: GithubCommitComparison;
  coders: string[];
  organisation: string;
  institution: string;
}

@Injectable()
export class DataService {
  constructor(private mongo: MongoDbService) {
    this.dataPath = process.env.DATA_PATH;
  }
  async onApplicationBootstrap() {
    this.handler();
  }

  private readonly logger = new Logger(DataService.name);
  private dataPath: string;

  private handler(): void {
    this.logger.log('Handling all the new data');
    const fileNames: string[] = fs.readdirSync(this.dataPath);

    const contributorFileNames: string[] = fileNames.filter((fileName) =>
      fileName.includes('user'),
    );
    const repositoryFileNames: string[] = fileNames.filter((fileName) =>
      fileName.includes('repository'),
    );
    const organisationFileNames: string[] = fileNames.filter((fileName) =>
      fileName.includes('organisation'),
    );
    /*contributorFileNames.forEach((contributorFileName) => {
      this.handleContributor(contributorFileName);
    });*/
    //await this.handleRepositories(repositoryFileNames);
    this.handleOrganisations(organisationFileNames);
    // handle org
    // remove all org files
    // update institution
  }

  private async handleOrganisations(organisationFileNames: string[]) {
    this.logger.log('Handling all organisations');
    for (const organisationFileName of organisationFileNames) {
      const orgData: string = this.readFile(
        this.dataPath.concat('/', organisationFileName),
      );
      if (!orgData) continue;
      const parsedFile: RawResponse = JSON.parse(orgData);
      const parsedData: GithubOrganisation = parsedFile.response['data'];
      const organisationName: string = parsedFile.orgName;
      if (parsedFile.method != Method.Organisation) continue;
      const newOragnisation = await this.createOrganisation(
        parsedData,
        organisationName,
      );
      await this.mongo.upsertRevisedOrganisation(newOragnisation);
    }
  }

  private async handleRepositories(
    repositoryFileNames: string[],
  ): Promise<void> {
    this.logger.log('Handling all repositories');
    let repositories: RepoData[] = [];
    for (const repofileName of repositoryFileNames) {
      const repoData: string = this.readFile(
        this.dataPath.concat('/', repofileName),
      );
      if (!repoData) continue;
      const parsedFile: RawResponse = JSON.parse(repoData);
      const repoName: string = parsedFile.repoName;
      const method: string = parsedFile.method;
      const parsedData: any = parsedFile.response['data'];
      let data: RepoData = {
        repository: null,
        contributors: [],
        commits: [],
        allPulls: [],
        closedPulls: [],
        allIssues: [],
        closedIssues: [],
        commitComments: [],
        languages: null,
        commitActivity: null,
        coders: null,
        comparedCommits: null,
        organisation: parsedFile.orgName,
        institution: parsedFile.institutionName,
      };
      if (repositories[repoName]) data = repositories[repoName];
      switch (method) {
        case Method.Repository:
          data.repository = parsedData;
          break;
        case Method.Contributor:
          data.contributors = data.contributors.concat(parsedData);
          break;
        case Method.Commit:
          data.commits = data.commits.concat(parsedData);
          break;
        case Method.PullRequest:
          const pullData = parsedData as GitHubPull;
          if (pullData.state == 'all') {
            data.allPulls = data.allPulls.concat(parsedData);
          }
          if (pullData.state == 'closed') {
            data.closedPulls = data.closedPulls.concat(parsedData);
          }
          break;
        case Method.Issue:
          const issueData = parsedData as GitHubIssue;
          if ((issueData.state = 'all')) {
            data.allIssues.concat(parsedData);
          }
          if ((issueData.state = 'closed')) {
            data.closedIssues.concat(parsedData);
          }
          break;
        case Method.Comment:
          data.commitComments = data.commitComments.concat(parsedData);
          break;
        case Method.Language:
          data.languages = parsedData;
          break;
        case Method.CompareCommit:
          data.comparedCommits = parsedData;
          break;
      }
      repositories[repoName] = data;
    }
    Object.values(repositories).forEach(async (repository) => {
      this.logger.log(`Handling repository ${repository.repository.name}`);
      const res = await this.mongo.findRepositoryRevised(
        repository.repository.name,
        repository.institution,
      );
      const newRepo = await this.createRepository(
        repository,
        res ? res.stats : [],
        repository.comparedCommits ? repository.comparedCommits.ahead_by : 0,
      );
      await this.mongo.upsertRevisedRepository(newRepo);
    });
  }

  private handleContributor(fileName: string): void {
    this.logger.log(`Handling file ${fileName}`);
    const userData: string = this.readFile(this.dataPath.concat('/', fileName));
    if (!userData) return;
    const parsedFile: RawResponse = JSON.parse(userData);
    const parsedData: GithubUser = parsedFile.response['data'];
    const contributor = this.createContributor(parsedData);
    this.mongo.upsertContributor(contributor);
  }

  /******************************************Helper Functions*******************************************************/

  private readFile(path: string): string {
    //this.logger.log(`Reading file at path ${path}`);
    try {
      return fs.readFileSync(path, 'utf8');
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  private createContributor(contributorData: GithubUser): Contributor {
    this.logger.log(`Creating contributor ${contributorData.login}`);
    const contributor: Contributor = {
      login: contributorData.login,
      name: contributorData.name,
      avatar_url: contributorData.avatar_url,
      bio: contributorData.bio,
      blog: contributorData.blog,
      company: contributorData.company,
      email: contributorData.email,
      twitter_username: contributorData.twitter_username,
      location: contributorData.location,
      created_at: new Date(contributorData.created_at),
      updated_at: new Date(contributorData.updated_at),
      public_repos: contributorData.public_repos,
      public_gists: contributorData.public_gists,
      followers: contributorData.followers,
      following: contributorData.following,
    };
    return contributor;
  }

  private async createRepository(
    repositoryData: RepoData,
    currentRepositoryStats: RepositoryStats[],
    aheadByCommits: number,
  ): Promise<RepositoryRevised> {
    const repositoryStats: RepositoryStats = {
      num_forks: repositoryData.repository.forks_count,
      num_contributors: repositoryData.contributors.length,
      num_commits: repositoryData.commits.length,
      num_stars: repositoryData.repository.stargazers_count,
      num_watchers: repositoryData.repository.subscribers_count,
      has_own_commits: aheadByCommits,
      issues_closed: repositoryData.closedIssues.length,
      issues_all: repositoryData.allIssues.length,
      pull_requests_closed: repositoryData.closedIssues.length,
      pull_requests_all: repositoryData.allPulls.length,
      comments: repositoryData.commitComments.length,
      languages: repositoryData.languages,
    };
    currentRepositoryStats.push(repositoryStats);
    const repository: RepositoryRevised = {
      name: repositoryData.repository.name,
      uuid: uuidv4(),
      url: repositoryData.repository.html_url,
      institution: repositoryData.institution,
      organization: repositoryData.organisation,
      description: repositoryData.repository.description,
      fork: repositoryData.repository.fork,
      archived: repositoryData.repository.archived,
      timestamp: new Date(),
      created_at: new Date(repositoryData.repository.created_at),
      updated_at: new Date(repositoryData.repository.updated_at),
      contributors: await this.getContributorsFromDB(
        repositoryData.contributors.map((contributor) => contributor.login),
      ),
      coders: this.getCodersFromCommits(repositoryData.commits),
      license: repositoryData.repository.license
        ? repositoryData.repository.license.name
        : 'none',
      stats: currentRepositoryStats,
      logo: repositoryData.repository.owner.avatar_url,
    };
    return repository;
  }

  private async createOrganisation(
    organisationData: GithubOrganisation,
    organisationName: string,
  ): Promise<OrganisationRevised> {
    const organisation: OrganisationRevised = {
      name: organisationName,
      url: organisationData.html_url,
      description: organisationData.description,
      avatar: organisationData.avatar_url,
      created_at: organisationData.created_at,
      locations: organisationData.location,
      email: organisationData.email,
      repos: await this.getRepositoriesFromDB(organisationName),
    };
    return organisation;
  }

  /**
   * Get all the coders out of the repository commits
   * @param commits All the repository commits
   * @returns A list of coder names
   */
  private getCodersFromCommits(commits: GithubCommit[]): string[] {
    const coders: string[] = [];
    for (const commit of commits) {
      if (!commit.author) continue;
      if (coders.includes(commit.author.login)) continue;
      coders.push(commit.author.login);
    }
    return coders;
  }

  /**
   * Get all the ObjectIDs of the contributors
   * @param contributorLogins The logins of the contributors
   * @returns An array with the contributor arrays
   */
  private async getContributorsFromDB(
    contributorLogins: string[],
  ): Promise<ObjectId[]> {
    const res = await this.mongo.searchContributors(contributorLogins);
    return res.map((contributor) => contributor['_id']);
  }

  private async getRepositoriesFromDB(
    organisationName: string,
  ): Promise<ObjectId[]> {
    const res = await this.mongo.findAllOrganisationrepository(
      organisationName,
    );
    return res.map((repository) => repository['_id']);
  }
}
