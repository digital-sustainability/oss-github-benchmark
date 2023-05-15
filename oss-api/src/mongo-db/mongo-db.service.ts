import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { MongoClient, ConnectOptions, ObjectId } from 'mongodb';
import {
  Institution,
  Repository,
  User,
  TodoInstitution,
  Organisation,
  ApiInstitution,
  GroupCount,
  ApiRepository,
  ObjectCount,
  ApiUser,
} from 'src/interfaces';

enum Tables {
  instituions = 'institutions',
  organisations = 'organisation',
  repositories = 'repositories',
  todoInstituions = 'todoInstitutions',
  users = 'usersNew',
}

@Injectable()
export class MongoDbService
  implements OnApplicationBootstrap, OnApplicationShutdown, OnModuleInit
{
  constructor() {}
  async onApplicationShutdown(signal?: string) {
    await this.destroyConnection();
  }
  async onApplicationBootstrap() {}
  async onModuleInit() {
    this.database = process.env.MONGO_DATABASE || 'testing';
    await this.initializeConnection();
  }

  private database: string;
  private client: MongoClient | undefined;
  private readonly logger = new Logger(MongoDbService.name);

  private async initializeConnection() {
    if (this.client !== undefined) return;
    this.client = await new MongoClient(process.env.MONGO_READ, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions).connect();
    this.client
      .db(this.database)
      .collection('institutions')
      .createIndex({ '$**': 'text' });
    this.client
      .db(this.database)
      .collection('repositories')
      .createIndex({ '$**': 'text' });
    this.client
      .db(this.database)
      .collection('users')
      .createIndex({ '$**': 'text' });
  }
  private async destroyConnection() {
    if (!this.client) return;
    await this.client.close();
    this.client = undefined;
  }

  /***********************************Create************************************************/

  /**
   * Create a new user in the database
   * @param user The user object
   */
  async createNewUser(user: User): Promise<void> {
    this.logger.log(
      `Adding new user with username ${user.login} to the database`,
    );
    this.client
      .db(this.database)
      .collection<User>(Tables.users)
      .insertOne(user);
  }

  /**
   * Create a new repository in the database
   * @param repository The repository object
   */
  async createNewRepository(repository: Repository): Promise<void> {
    this.logger.log(
      `Adding new Repository named ${repository.name} to the database`,
    );
    this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .insertOne(repository);
  }

  /***********************************Read**************************************************/

  /**
   * Find a user by their username
   * @param userName The username of the user
   * @returns A User object
   */
  async findUserWithUserName(userName: string): Promise<User> {
    this.logger.log(
      `Searching the user with the username ${userName} in the database`,
    );
    return this.client
      .db(this.database)
      .collection<User>(Tables.users)
      .findOne({ login: userName });
  }

  /**
   * Find a repository
   * @param repoName the name of the repository
   * @param instiutitonName the name of the owning institution
   * @returns The found repository
   */
  async findRepository(
    repoName: string,
    instiutitonName: string,
  ): Promise<Repository> {
    this.logger.log(
      `Searching the repository with the name ${repoName} from the institution ${instiutitonName}`,
    );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .findOne({ name: repoName, institution: instiutitonName });
  }

  /**
   * Get all the todo institutions from the database
   * @returns A TodoInstitution array
   */
  async findAllTodoInstitutions(): Promise<TodoInstitution[]> {
    this.logger.log(`Getting all the todo institutions from the database`);
    const session = await this.client.startSession();
    return this.client
      .db(this.database)
      .collection<TodoInstitution>(Tables.todoInstituions)
      .find(
        {},
        {
          session,
        },
      )
      .toArray();
  }

  /**
   * Get the institution with the given uuid
   * @param uuid The uuid of the institution
   * @returns A Insitution object
   */
  async findInstitutionWithUUID(uuid: string): Promise<Institution> {
    this.logger.log(
      `Getting the institution with the uuid ${uuid} from the database`,
    );
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.instituions)
      .findOne({ uuid: uuid });
  }

  /**
   * Get the organisation with the given name
   * @param name The name of the organisation
   * @returns A Organsation object
   */
  async findOrganisationWithName(name: string): Promise<Organisation> {
    this.logger.log(
      `Getting the organisation with the name ${name} from the database`,
    );
    return this.client
      .db(this.database)
      .collection<Organisation>(Tables.organisations)
      .findOne({ name: name });
  }

  /**
   * Get all institutions from the database
   * @param key The sort key
   * @param direction The sort direction
   * @param sectors The chosen sectors
   * @param limit The limit
   * @param page The page
   * @returns The sorted repositories corresponding to the inputs
   */
  async findInstitutionsLimitedSorted(
    key: string,
    direction: 1 | -1,
    sectors: string[],
    limit: number,
    page: number,
  ): Promise<ApiInstitution[]> {
    this.logger.log(
      `Getting ${limit} institutions from the database. Sorted by ${key} in ${direction} direction`,
    );
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.instituions)
      .aggregate([
        { $match: { sector: { $in: sectors } } },
        {
          $project: {
            _id: 0,
            name_de: 1,
            num_members: 1,
            num_repos: 1,
            sector: 1,
            avatar: 1,
            shortname: 1,
            repo_names: { $slice: ['$repo_names', 0, 10] },
            total_num_forks_in_repos: 1,
            location: {
              $getField: {
                field: 'location',
                input: { $arrayElemAt: ['$orgs', 0] },
              },
            },
            created_at: {
              $min: '$orgs.created_at',
            },
          },
        },
        {
          $sort: { [key]: direction },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
      ])
      .toArray() as Promise<ApiInstitution[]>;
  }

  /**
   * Get all the instituions corresponding to the search term
   * @param searchTerm The search term
   * @param key The sort key
   * @param direction The sort direction
   * @param sectors The chosen sectors
   * @param limit The limit
   * @param page The page
   * @param includeForks A boolean to indicate if forked repos should also be included
   * @returns The sorted repositories corresponding to the inputs
   */
  async findInstitutionsWithSearchTerm(
    searchTerm: string,
    key: string,
    direction: 1 | -1,
    sectors: string[],
    limit: number,
    page: number,
    includeForks: boolean,
  ): Promise<ApiInstitution[]> {
    this.logger.log(`Searching for institutions containing ${searchTerm}`);
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.instituions)
      .aggregate([
        {
          $match: {
            $and: [
              { $text: { $search: searchTerm } },
              { sector: { $in: sectors } },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            stats: 1,
            name_de: 1,
            num_members: 1,
            num_repos: 1,
            sector: 1,
            avatar: 1,
            shortname: 1,
            repo_names: { $slice: ['$repo_names', 0, 10] },
            total_num_forks_in_repos: 1,
            location: {
              $getField: {
                field: 'location',
                input: { $arrayElemAt: ['$orgs', 0] },
              },
            },
            created_at: {
              $getField: {
                field: 'created_at',
                input: { $arrayElemAt: ['$orgs', 0] },
              },
            },
            description: 1,
            email: 1,
            total_num_contributors: 1,
            total_num_own_repo_forks: 1,
            total_num_commits: 1,
            total_pull_requests: 1,
            total_issues: 1,
            total_num_stars: 1,
            total_num_watchers: 1,
            total_commits_last_year: 1,
            total_pull_requests_all: 1,
            total_pull_requests_closed: 1,
            total_issues_all: 1,
            total_issues_closed: 1,
            total_comments: 1,
            num_orgs: 1,
            orgs: 1,
          },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
        {
          $sort: { [key]: direction },
        },
      ])
      .toArray() as Promise<ApiInstitution[]>;
  }

  /**
   * Count how many institutions there are with the given sectors
   * @param sectors An array with the sectors
   * @returns An Group count array with the sector names and how many there are
   */
  async countAllInstitutions(sectors: string[]): Promise<GroupCount[]> {
    this.logger.log(
      `Counting institutions corresponding to these sectors: ${sectors}`,
    );
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.instituions)
      .aggregate([
        { $match: { sector: { $in: sectors } } },
        {
          $group: {
            _id: '$sector',
            total: { $count: {} },
          },
        },
      ])
      .toArray() as Promise<GroupCount[]>;
  }

  /**
   * Count all the Institutions with the given sectors and search term
   * @param searchTerm The search term
   * @param sectors An array with the sectors
   * @returns An Group count array with the sector names and how many there are
   */
  async countAllInstitutionsWithSearchTerm(
    searchTerm: string,
    sectors: string[],
  ): Promise<GroupCount[]> {
    this.logger.log(
      `Counting institutions corresponding to this search term: ${searchTerm} and these sectors: ${sectors}`,
    );
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.instituions)
      .aggregate([
        {
          $match: {
            $and: [
              { $text: { $search: searchTerm } },
              { sector: { $in: sectors } },
            ],
          },
        },
        {
          $group: {
            _id: '$sector',
            total: { $count: {} },
          },
        },
      ])
      .toArray() as Promise<GroupCount[]>;
  }

  /**
   * Get all the repositories corresponding to the inputs
   * @param key The sort key
   * @param direction The sort direction
   * @param limit The limit
   * @param page The page
   * @param includeForks If forks should also be included
   * @returns An array of ApiRepositories
   */
  async findAllRepositoriesLimitedSorted(
    key: string,
    direction: 1 | -1,
    limit: number,
    page: number,
    includeForks: boolean[],
  ): Promise<ApiRepository[]> {
    this.logger.log(
      `Getting ${limit} repositories from the database. Sorted by ${key} in ${direction} direction`,
    );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .aggregate([
        { $match: { fork: { $in: includeForks } } },
        {
          $project: {
            _id: 0,
            uuid: 1,
            name: 1,
            url: 1,
            description: 1,
            timestamp: 1,
            institution: 1,
            organization: 1,
            comments: 1,
            issues_all: 1,
            pull_requests_all: 1,
            pull_requests_closed: 1,
            issues_closed: 1,
            num_commits: 1,
            num_contributors: 1,
            num_watchers: 1,
            num_forks: 1,
            num_stars: 1,
            has_own_commits: 1,
            createdTimestamp: 1,
            updatedTimestamp: 1,
            fork: 1,
            license: 1,
            logo: 1,
          },
        },
        {
          $sort: { [key]: direction },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
      ])
      .toArray() as Promise<ApiRepository[]>;
  }

  /**
   * Get all the repositories corresponding to the inputs
   * @param searchTerm The search term
   * @param key The sort key
   * @param direction The sort direction
   * @param limit The limit
   * @param page The page
   * @param includeForks If forks should also be included
   * @returns An array of ApiRepositories
   */
  async findRepositoryWithSearchTerm(
    searchTerm: string,
    includeForks: boolean[],
    key: string,
    direction: 1 | -1,
    limit: number,
    page: number,
  ): Promise<ApiRepository[]> {
    this.logger.log(
      `Getting all the repositories with the search term: ${searchTerm}`,
    );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .aggregate([
        {
          $match: {
            $and: [
              { $text: { $search: searchTerm } },
              { fork: { $in: includeForks } },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            uuid: 1,
            name: 1,
            url: 1,
            description: 1,
            timestamp: 1,
            institution: 1,
            organization: 1,
            comments: 1,
            issues_all: 1,
            pull_requests_all: 1,
            pull_requests_closed: 1,
            issues_closed: 1,
            num_commits: 1,
            num_contributors: 1,
            num_watchers: 1,
            num_forks: 1,
            num_stars: 1,
            has_own_commits: 1,
            createdTimestamp: 1,
            updatedTimestamp: 1,
            fork: 1,
            license: 1,
            logo: 1,
          },
        },
        {
          $sort: { [key]: direction },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
      ])
      .toArray() as Promise<ApiRepository[]>;
  }

  /**
   * Count all the repos
   * @param includeForks If forks should be included
   * @returns An Object count array
   */
  async countAllRepositories(includeForks: boolean[]): Promise<ObjectCount[]> {
    this.logger.log(
      `Counting repositories corresponding with these fork values: ${includeForks}`,
    );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .aggregate([
        { $match: { fork: { $in: includeForks } } },
        {
          $count: 'total',
        },
      ])
      .toArray() as Promise<ObjectCount[]>;
  }

  /**
   * Count all the repos corresponding to the search term
   * @param searchTerm The search term
   * @param includeForks If forks should be included
   * @returns An Object count array
   */
  async countAllRepositoriesWithSearchTerm(
    searchTerm: string,
    includeForks: boolean[],
  ): Promise<ObjectCount[]> {
    this.logger.log(
      `Counting repositories corresponding with these fork values: ${includeForks} and this search term: ${searchTerm}`,
    );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .aggregate([
        {
          $match: {
            $and: [
              { $text: { $search: searchTerm } },
              { fork: { $in: includeForks } },
            ],
          },
        },
        {
          $count: 'total',
        },
      ])
      .toArray() as Promise<ObjectCount[]>;
  }

  /**
   * Get all the users corresponding to the inputs
   * @param key The sort key
   * @param direction The sort direction
   * @param limit The limit
   * @param page The page
   * @returns An ApiUser array
   */
  async findAllUsersLimitedSorted(
    key: string,
    direction: 1 | -1,
    limit: number,
    page: number,
  ): Promise<ApiUser[]> {
    this.logger.log(
      `Getting ${limit} users from the database. Sorted by ${key} in ${direction} direction`,
    );
    return this.client
      .db(this.database)
      .collection<User>(Tables.users)
      .aggregate([
        {
          $project: {
            _id: 0,
            avatar_url: 1,
            name: 1,
            login: 1,
            company: 1,
            location: 1,
            twitter_username: 1,
            public_repos: 1,
            public_gists: 1,
            followers: 1,
            created_at: 1,
            updated_at: 1,
            contributions: 1,
          },
        },
        {
          $sort: { [key]: direction },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
      ])
      .toArray() as Promise<ApiUser[]>;
  }

  /**
   * Get all the users corresponding to the inputs
   * @param searchTerm
   * @param key The sort key
   * @param direction The sort direction
   * @param limit The limit
   * @param page The page
   * @returns An ApiUser array
   */
  async findUsersWithSearchTerm(
    searchTerm: string,
    key: string,
    direction: 1 | -1,
    limit: number,
    page: number,
  ): Promise<ApiUser[]> {
    this.logger.log(
      `Searching for users in the database with the search term: ${searchTerm}`,
    );
    return this.client
      .db(this.database)
      .collection<User>(Tables.users)
      .aggregate([
        {
          $match: { $text: { $search: searchTerm } },
        },
        {
          $project: {
            _id: 0,
            avatar_url: 1,
            name: 1,
            login: 1,
            company: 1,
            location: 1,
            twitter_username: 1,
            public_repos: 1,
            public_gists: 1,
            followers: 1,
            created_at: 1,
            updated_at: 1,
            contributions: 1,
          },
        },
        {
          $sort: { [key]: direction },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
      ])
      .toArray() as Promise<ApiUser[]>;
  }

  /**
   * Count all users in the database
   * @returns An ObjectCount array
   */
  async countAllUsers(): Promise<ObjectCount[]> {
    this.logger.log(`Counting all Users`);
    return this.client
      .db(this.database)
      .collection<User>(Tables.users)
      .aggregate([
        {
          $count: 'total',
        },
      ])
      .toArray() as Promise<ObjectCount[]>;
  }

  /**
   * Count all users corresponding to the search term
   * @param searchTerm The search term
   * @returns An ObjectCount array
   */
  async countAllUsersWithSearchTerm(
    searchTerm: string,
  ): Promise<ObjectCount[]> {
    this.logger.log(
      `Counting users corresponding with this search term: ${searchTerm}`,
    );
    return this.client
      .db(this.database)
      .collection<User>(Tables.users)
      .aggregate([
        {
          $match: { $text: { $search: searchTerm } },
        },
        {
          $count: 'total',
        },
      ])
      .toArray() as Promise<ObjectCount[]>;
  }

  /**
   * Get the latest crawl date
   * @returns The latest crawl date as array
   */
  async latestUpdate() {
    this.logger.log('Getting the latest crawl run date');
    return this.client
      .db(this.database)
      .collection(Tables.instituions)
      .aggregate([
        {
          $project: {
            _id: 0,
            updatedDate: { $max: '$timestamp' },
          },
        },
        {
          $sort: { updatedDate: -1 },
        },
        {
          $limit: 1,
        },
      ])
      .toArray();
  }
  /***********************************Update************************************************/

  /**
   * Update a user in the database
   * @param user The user object
   */
  async updateUser(user: User): Promise<void> {
    this.logger.log(
      `Updating user with the username ${user.login} in the database.`,
    );
    this.client.db(this.database).collection<User>(Tables.users).replaceOne(
      { login: user.login },
      {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        blog: user.blog,
        company: user.company,
        email: user.email,
        twitter_username: user.twitter_username,
        location: user.location,
        created_at: user.created_at,
        updated_at: user.updated_at,
        contributions: user.contributions,
        public_repos: user.public_repos,
        public_gists: user.public_gists,
        followers: user.followers,
        following: user.following,
        orgs: user.orgs,
      },
    );
  }

  /**
   * Create or update a institution in the database
   * @param institution A institution object
   */
  async upsertInstitution(institution: Institution): Promise<void> {
    this.logger.log(
      `Upserting institution ${institution.name_de} in the database`,
    );
    this.client
      .db(this.database)
      .collection<Institution>(Tables.instituions)
      .replaceOne(
        { uuid: institution.uuid },
        {
          uuid: institution.uuid,
          shortname: institution.shortname,
          name_de: institution.name_de,
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
          total_pull_requests_all: institution.total_pull_requests_all,
          total_pull_requests_closed: institution.total_pull_requests_closed,
          total_issues_all: institution.total_issues_all,
          total_issues_closed: institution.total_issues_closed,
          total_comments: institution.total_comments,
          org_names: institution.org_names,
          orgs: institution.orgs,
          num_orgs: institution.num_orgs,
          avatar: institution.avatar,
          repos: institution.repos,
          repo_names: institution.repo_names,
          total_licenses: institution.total_licenses,
          timestamp: institution.timestamp,
          sector: institution.sector,
          stats: institution.stats,
          searchString: institution.searchString,
        },
        { upsert: true },
      );
  }

  /**
   * Update the timestamp of a todo insitution
   * @param uuid The institution uuid
   */
  async updateTodoInstitutionTimestamp(uuid: string): Promise<void> {
    this.logger.log(
      `Updating timestamp of the institution with the uuid ${uuid}.`,
    );
    this.client
      .db(this.database)
      .collection<TodoInstitution>(Tables.todoInstituions)
      .updateOne({ uuid: uuid }, { $set: { ts: new Date() } });
  }

  /**
   * Update all org timestamps of a todo institution
   * @param institution The todo insitution object
   */
  async updateOrgTimestamp(institution: TodoInstitution): Promise<void> {
    this.logger.log(
      `Updating timestamp of all orgs of the instituion ${institution.uuid}`,
    );
    this.client
      .db(this.database)
      .collection<TodoInstitution>(Tables.todoInstituions)
      .updateOne(
        { uuid: institution.uuid },
        { $set: { orgs: institution.orgs } },
      );
  }

  /**
   * Upsert an Organisation
   * @param organisation the Organisation Object
   */
  async upsertOrg(organisation: Organisation): Promise<void> {
    this.logger.log(`Upserting organsisation ${organisation.name}`);
    this.client
      .db(this.database)
      .collection<Organisation>(Tables.organisations)
      .replaceOne(
        { name: organisation.name },
        {
          num_repos: organisation.num_repos,
          num_members: organisation.num_members,
          total_num_contributors: organisation.total_num_contributors,
          total_num_own_repo_forks: organisation.total_num_own_repo_forks,
          total_num_forks_in_repos: organisation.total_num_forks_in_repos,
          total_num_commits: organisation.total_num_commits,
          total_pull_requests: organisation.total_pull_requests,
          total_issues: organisation.total_issues,
          total_num_stars: organisation.total_num_stars,
          total_num_watchers: organisation.total_num_watchers,
          total_pull_requests_all: organisation.total_pull_requests_all,
          total_pull_requests_closed: organisation.total_pull_requests_closed,
          total_issues_all: organisation.total_issues_all,
          total_issues_closed: organisation.total_issues_closed,
          total_comments: organisation.total_comments,
          name: organisation.name,
          url: organisation.url,
          description: organisation.description,
          avatar: organisation.avatar,
          created_at: organisation.created_at,
          location: organisation.location,
          email: organisation.email,
          repos: organisation.repos,
          repo_names: organisation.repo_names,
          total_licenses: organisation.total_licenses,
          timestamp: organisation.timestamp,
        },
        { upsert: true },
      );
  }

  /**
   * Upsert a repository
   * @param repo the repository object
   * @param id the id of the old database entry
   */
  async upsertRepository(repo: Repository): Promise<void> {
    this.logger.log(`Upserting repository ${repo.name}`);
    this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .replaceOne(
        { name: repo.name, institution: repo.institution },
        { ...repo },
        { upsert: true },
      );
  }

  /***********************************Delete************************************************/
}
