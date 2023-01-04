import {
  Injectable,
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
import user from './models/user';

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

  private async handleUser(
    user: GithubContributor,
    repoName: string,
    orgName: string,
    institutioName: string,
  ) {
    // Get User from Github
    const gitUser = await this.getGitHubUser(
      user.login,
      institutioName,
      orgName,
      repoName,
    );
    // If the gitUser is null, return
    if (!gitUser) return null;
    // Get User data from Database
    const databaseUser = await this.getDatabaseUser(user.login);
    // Create Contribution object
    const contributionObject = await this.createContributionObject(
      repoName,
      orgName,
      institutioName,
      user.contributions,
    );
    // Create User Object
    let newUser = await this.createNewUserObject(
      gitUser,
      contributionObject,
      orgName,
      databaseUser.orgs,
    );
    // If user is new (not in db), add created contribution object, add orgs, and save to database
    if (!databaseUser) {
      await this.mongoService.createUser(newUser);
      return;
    }
    // Transform and save the new contribution
    newUser.contributions = await this.transformContributions(
      databaseUser,
      institutioName,
      orgName,
      repoName,
      contributionObject,
    );
    // Write to Database
    await this.mongoService.updateUser(newUser);
  }

  private async getGitHubUser(
    userName: string,
    institutionName: string,
    orgName: string,
    repoName: string,
  ): Promise<null | GithubUser> {
    // Get the user data from github
    const gitUserResponse = await this.githubService.get_User(userName);
    // Write the plain data into the database
    this.mongoService.createRawResponse(
      'get_github_user',
      institutionName,
      orgName,
      repoName,
      userName,
      gitUserResponse,
    );
    // Check if there was an error (other status than 200)
    if (gitUserResponse.status != 200) return null;
    // Else return the transformed Data
    return gitUserResponse.data as GithubUser;
  }

  private async getDatabaseUser(userName: string): Promise<null | User> {
    // Create the query config
    let queryConfig: UserQueryConfig = {
      search: userName,
      sort: '',
      direction: 'DESC',
      page: 0,
      count: 1,
    };
    // Get the database user
    let databaseUser = await this.mongoService.findUsers(queryConfig);
    // Check if there is only one result
    if (databaseUser.total != 1) return null;
    // Return the user
    return databaseUser.users[0];
  }

  private async createContributionObject(
    repoName: string,
    orgName: string,
    institutionName: string,
    numberOfContributions: number,
  ): Promise<Contributions> {
    // Create contribution object
    let repoContribution: RepositoryContributions = {
      [repoName]: numberOfContributions,
    };
    let orgContribution: OrganisationContributions = {
      [orgName]: repoContribution,
    };
    let contribution: Contributions = { [institutionName]: orgContribution };
    return contribution;
  }

  private async createNewUserObject(
    githubUser: GithubUser,
    contibutions: Contributions,
    orgName: string,
    savedOrgs: string[],
  ): Promise<User> {
    // If this org is not saved in the database, push it into the array
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

  private async transformContributions(
    databaseUser: User,
    institutionName: string,
    orgName: string,
    repoName: string,
    newContribution: Contributions,
  ) {
    // Get contributions
    let dbContributions = databaseUser.contributions;
    // If the instituion doesnt exist in the user contribution, add it. Same with organisation and repository
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
    // Then return the new contribution object
    return dbContributions;
  }
}
