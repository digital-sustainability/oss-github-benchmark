import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { GithubService } from 'src/github/github.service';
import {
  Contributions,
  GithubContributor,
  GithubUser,
  OrganisationContributions,
  RepositoryContributions,
  User,
  UserQueryConfig,
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';

// TODO - merge createContributionObject and mergeContributions
// TODO - create new find user method

@Injectable()
export class DataGatheringService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    private githubService: GithubService,
    private mongoService: MongoDbService,
  ) {}
  async onApplicationBootstrap() {}
  async onApplicationShutdown(signal?: string) {}

  private readonly logger = new Logger(DataGatheringService.name);

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
  ) {
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
   * Get the specified user data from the database
   * @param userName The username of the specified user
   * @returns Null or a User object containing the data of the specified user
   */
  private async getDatabaseUser(userName: string): Promise<null | User> {
    this.logger.log(
      `Getting the userdata from the database with the username ${userName}.`,
    );
    let queryConfig: UserQueryConfig = {
      search: userName,
      sort: '',
      direction: 'DESC',
      page: 0,
      count: 1,
    };
    let databaseUser = await this.mongoService.findUsers(queryConfig);
    if (databaseUser.total != 1) return null;
    return databaseUser.users[0];
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
}
