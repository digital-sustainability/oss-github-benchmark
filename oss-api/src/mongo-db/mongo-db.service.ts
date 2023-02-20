import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { MongoClient, ConnectOptions } from 'mongodb';
import {
  Institution,
  Repository,
  User,
  Status,
  Progress,
  InstitutionQueryConfig,
  UserQueryConfig,
  RepositoryQueryConfig,
  RawResponse,
  TodoInstitution,
  Organisation,
} from 'src/interfaces';
import { OctokitResponse } from '@octokit/types';

@Injectable()
export class MongoDbService
  implements OnApplicationBootstrap, OnApplicationShutdown, OnModuleInit
{
  constructor() {}
  async onApplicationShutdown(signal?: string) {
    await this.destroyConnection();
  }
  async onApplicationBootstrap() {
    /*this.getData().then(() => console.log('Loaded data'));
    setInterval(() => {
      this.getData().then(() => console.log('Reloaded data'));
    }, 3600000);*/
  }
  async onModuleInit() {
    this.database = process.env.MONGO_DATABASE || 'testing';
    await this.initializeConnection();
  }

  private database: string;
  private client: MongoClient | undefined;
  //private institutions: Institution[] | undefined;
  //private repositories: Repository[] | undefined;
  //private users: User[] | undefined;
  private status: Status | undefined;
  //private institutionSearchStrings: string[];
  //private repositorySearchStrings: string[];
  //private userSearchStrings: string[];
  //private updateDate: Date = new Date();
  private readonly logger = new Logger(MongoDbService.name);

  private async initializeConnection() {
    if (this.client !== undefined) return;
    this.client = await new MongoClient(process.env.MONGO_READ, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions).connect();
    this.client
      .db('statistics')
      .collection('institutions')
      .createIndex({ '$**': 'text' });
    this.client
      .db('statistics')
      .collection('repositories')
      .createIndex({ '$**': 'text' });
    this.client
      .db('statistics')
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
   * Create a raw response entry in the database
   * @param method The github method used
   * @param institutionName The name of the institution
   * @param orgName The organisation Name
   * @param repoName The name of the repository
   * @param userName The name of the user
   * @param response The response object
   */
  async createRawResponse(
    method: string,
    institutionName: string,
    orgName?: string,
    repoName?: string,
    userName?: string,
    response?: OctokitResponse<any>,
  ): Promise<void> {
    this.logger.log(
      `Adding raw response to the database, sized ${
        JSON.stringify(response).length
      }.`,
    );
    this.client
      .db(this.database)
      .collection<RawResponse>('rawResponse')
      .insertOne({
        method: method,
        ts: new Date(),
        institutionName: institutionName,
        orgName: orgName,
        repoName: repoName,
        userName: userName,
        response: response,
      });
  }

  /**
   * Create a new user in the database
   * @param user The user object
   */
  async createNewUser(user: User): Promise<void> {
    this.logger.log(
      `Adding new user with username ${user.login} to the database`,
    );
    this.client.db(this.database).collection<User>('usersNew').insertOne(user);
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
      .collection<Repository>('repositoryNew')
      .insertOne(repository);
  }

  /***********************************Read**************************************************/

  /**
   * Find a user by their username
   * @param userName The username of the user
   * @returns A User object
   */
  async findUser(userName: string): Promise<User> {
    this.logger.log(
      `Searching the user with the username ${userName} in the database`,
    );
    return this.client
      .db(this.database)
      .collection<User>('usersNew')
      .findOne({ login: userName });
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
      .collection<TodoInstitution>('todoInstitutions')
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
  async findInstitution(uuid: string): Promise<Institution> {
    this.logger.log(
      `Getting the institution with the uuid ${uuid} from the database`,
    );
    return this.client
      .db(this.database)
      .collection<Institution>('institutions')
      .findOne({ uuid: uuid });
  }

  /**
   * Get the organisation with the given name
   * @param name The name of the organisation
   * @returns A Organsation object
   */
  async findOrganisation(name: string): Promise<Organisation> {
    this.logger.log(
      `Gettign the organisation with the name ${name} from the database`,
    );
    return this.client
      .db(this.database)
      .collection<Organisation>('organisation')
      .findOne({ name: name });
  }

  /**
   * Get all Institutions
   * @returns A Institution array
   */
  async findAllInstitutions(
    key: string,
    direction: 1 | -1,
  ): Promise<Institution[]> {
    this.logger.log('Getting all institutions from the database');
    return this.client
      .db('statistics')
      .collection<Institution>('institutions')
      .find()
      .project({
        name_de: 1,
        num_members: 1,
        num_repos: 1,
        sector: 1,
        location: 1,
        created_at: 1,
        repo_names: 1,
        avatar: 1,
        shortname: 1,
        total_num_forks_in_repos: 1,
      })
      .sort({ [key]: direction })
      .limit(30)
      .toArray() as Promise<Institution[]>;
  }

  async test(
    key: string,
    direction: 1 | -1,
    page: number,
    limit: number,
  ): Promise<Institution[]> {
    return this.client
      .db('statistics')
      .collection<Institution>('institutions')
      .aggregate([
        //{ $match: { $text: { $search: searchTerm } } },
        {
          $group: {
            _id: '$_id',
            name_de: { $first: '$name_de' },
            num_members: { $first: '$num_members' },
            num_repos: { $first: '$num_repos' },
            sector: { $first: '$sector' },
            location: { $first: '$location' },
            created_at: { $first: '$created_at' },
            avatar: { $first: '$avatar' },
            shortname: { $first: '$shortname' },
            repo_names: { $first: '$repo_names' },
            total_num_forks_in_repos: { $first: '$total_num_forks_in_repos' },
          },
        },
        {
          $sort: { [key]: direction },
        },
        /*{ $skip: page * limit },
        { $limit: limit },*/
        {
          $addFields: {
            repo_names: { $slice: ['$repo_names', 0, 10] },
          },
        },
      ])
      .toArray() as Promise<Institution[]>;
  }

  /**
   * Find Institutions by a search term
   * @param searchTerm The search term
   * @returns The found institutions as an array
   */
  async findInstitutions(searchTerm: string): Promise<Institution[]> {
    this.logger.log(`Searching for institutions containing ${searchTerm}`);
    return this.client
      .db('statistics')
      .collection<Institution>('institutions')
      .find({ $text: { $search: searchTerm } })
      .project({
        name_de: 1,
        num_members: 1,
        num_repos: 1,
        sector: 1,
        location: 1,
        created_at: 1,
        repo_names: 1,
        avatar: 1,
        shortname: 1,
      })
      .toArray() as Promise<Institution[]>;
  }

  /**
   * Get all the repositories
   * @returns The repository array
   */
  async findAllRepositories(): Promise<Repository[]> {
    this.logger.log('Get all Repositories from the database');
    const session = this.client.startSession();
    return this.client
      .db('statistics')
      .collection<Repository>('repositories')
      .find(
        {},
        {
          projection: {
            commit_activities: 0,
          },
          session: session,
        },
      )
      .toArray();
  }

  /**
   * Find Repositories by a search term
   * @param searchTerm The search term
   * @returns The found repositories as an array
   */
  async findRepository(searchTerm: string): Promise<Repository[]> {
    this.logger.log(
      `Getting all the repositories with the search term: ${searchTerm}`,
    );
    return this.client
      .db('statistics')
      .collection<Repository>('repositories')
      .find({ $text: { $search: searchTerm } })
      .toArray();
  }

  /**
   * Get all users from the database
   * @returns The users in a array
   */
  async findAllUsers(): Promise<User[]> {
    this.logger.log('Getting all users from the database');
    const session = this.client.startSession();
    return this.client
      .db('statistics')
      .collection<User>('users')
      .find({}, { session: session })
      .toArray();
  }

  /**
   * Find people with the given search term
   * @param searchTerm The search term
   * @returns A users array
   */
  async findPeople(searchTerm: string): Promise<User[]> {
    this.logger.log(
      `Searching for Users in the database with the search term: ${searchTerm}`,
    );
    return this.client
      .db('statistics')
      .collection<User>('users')
      .find({ $text: { $search: searchTerm } })
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
    this.client.db(this.database).collection<User>('usersNew').replaceOne(
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
  async updateInstitution(institution: Institution): Promise<void> {
    this.logger.log(
      `Updating/Creating institution ${institution.name_de} in the database`,
    );
    this.client
      .db(this.database)
      .collection<Institution>('institutions')
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
          timestamp: new Date(),
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
  async updateTodoInstitutionTs(uuid: string): Promise<void> {
    this.logger.log(
      `Updating timestamp og the institution with the uuid ${uuid}.`,
    );
    this.client
      .db(this.database)
      .collection('todoInstitutions')
      .updateOne({ uuid: uuid }, { $set: { ts: new Date() } });
  }

  /**
   * Update all orgs of a todo institution
   * @param institution The todo insitution object
   */
  async updateOrgTimestamp(institution: TodoInstitution): Promise<void> {
    this.logger.log(
      `Updating timestamp of all orgs of the instituion ${institution.uuid}`,
    );
    this.client
      .db(this.database)
      .collection('todoInstitutions')
      .updateOne(
        { uuid: institution.uuid },
        { $set: { orgs: institution.orgs } },
      );
  }

  /**
   * Update or Create a Organisation
   * @param organisation the Organisation Object
   */
  async upsertOrg(organisation: Organisation): Promise<void> {
    this.logger.log(`Updating organsisation ${organisation.name}`);
    this.client
      .db(this.database)
      .collection('organisation')
      .replaceOne(
        { name: organisation.name },
        {
          $set: {
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
          },
        },
        { upsert: true },
      );
  }

  /***********************************Delete************************************************/

  /***********************************Old************************************************/

  /*async findAllInstitutions() {
    return this.institutions;
  }*/
  /*async findAllRepositories() {
    return this.repositories;
  }
  async findAllUsers() {
    return this.users;
  }*/
  async findStatus() {
    return this.status;
  }

  /*async findInstitutionsOld(params: InstitutionQueryConfig) {
    // this if is not used
    if (params.findName) {
      return this.institutions.find((inst) => {
        return inst.shortname === params.findName;
      });
    }
    // The sectors of the institutions
    let sectors: { [key: string]: number } = {};
    let insts = this.institutions;
    // Search for all institutions
    if (params.search.length > 0)
      insts = insts.filter((institution: Institution, index) => {
        const search: string = this.institutionSearchStrings[index];
        return search.toLowerCase().includes(params.search.toLowerCase());
      });
    // Get all the sectors
    insts.forEach((institution) => {
      sectors[institution.sector] = (sectors[institution.sector] ?? 0) + 1;
    });

    // Check for the sector
    if (params.sector.length > 0)
      insts = insts.filter((institution: Institution) => {
        return params.sector.includes(institution.sector);
      });
    // Sort institutions
    insts = [...insts].sort((a, b) => {
      if (typeof a[params.sort] == 'string') {
        return params.direction == 'ASC'
          ? b[params.sort]
              .toLowerCase()
              .localeCompare(a[params.sort].toLowerCase())
          : a[params.sort]
              .toLowerCase()
              .localeCompare(b[params.sort].toLowerCase());
      } else {
        return params.direction == 'ASC'
          ? a[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos) -
              b[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos)
          : b[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos) -
              a[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos);
      }
    });
    let total = insts.length;
    if (params.sendStats) {
      return {
        institutions: insts.slice(
          params.page * params.count,
          (params.page + 1) * params.count,
        ),
        total: total,
        sectors: sectors,
      };
    } else {
      insts = insts.slice(
        params.page * params.count,
        (params.page + 1) * params.count,
      );
      const institutionsWithoutStats: Institution[] = insts.map(
        (inst: Institution) => {
          const { stats, ...institutionWithoutStats } = inst;
          return institutionWithoutStats;
        },
      );
      return {
        institutions: institutionsWithoutStats,
        total: total,
        sectors: sectors,
      };
    }
  }*/
  /*async findRepositories(params: RepositoryQueryConfig) {
    let repositories = this.repositories;
    if (params.search.length > 0)
      repositories = repositories.filter((repository: Repository, index) => {
        const search: string = this.repositorySearchStrings[index];
        if (!search) return false;
        return search.toLowerCase().includes(params.search.toLowerCase());
      });
    if (!params.includeForks)
      repositories = repositories.filter((repository: Repository, index) => {
        return !repository.fork;
      });
    repositories = [...repositories].sort((a, b) => {
      try {
        if (typeof a[params.sort] == 'string') {
          return params.direction == 'ASC'
            ? b[params.sort]
                .toLowerCase()
                .localeCompare(a[params.sort].toLowerCase())
            : a[params.sort]
                .toLowerCase()
                .localeCompare(b[params.sort].toLowerCase());
        } else {
          return params.direction == 'ASC'
            ? a[params.sort] - b[params.sort]
            : b[params.sort] - a[params.sort];
        }
      } catch {
        return !b[params.sort];
      }
    });
    return {
      repositories: repositories.slice(
        params.page * params.count,
        (params.page + 1) * params.count,
      ),
      total: repositories.length,
    };
  }*/
  /*async findUsers(params: UserQueryConfig) {
    let users = this.users;
    if (params.search.length > 0)
      users = users.filter((user: User, index) => {
        const search: string = this.userSearchStrings[index];
        if (!search) return true;
        return search.toLowerCase().includes(params.search.toLowerCase());
      });
    users = [...users].sort((a, b) => {
      try {
        if (typeof a[params.sort] == 'string') {
          return params.direction == 'ASC'
            ? b[params.sort]
                .toLowerCase()
                .localeCompare(a[params.sort].toLowerCase())
            : a[params.sort]
                .toLowerCase()
                .localeCompare(b[params.sort].toLowerCase());
        } else {
          return params.direction == 'ASC'
            ? a[params.sort] - b[params.sort]
            : b[params.sort] - a[params.sort];
        }
      } catch {
        return !b[params.sort];
      }
    });
    return {
      users: users.slice(
        params.page * params.count,
        (params.page + 1) * params.count,
      ),
      total: users.length,
    };
  }*/

  /*private async getProgress(): Promise<undefined | Progress> {
    const session = this.client.startSession();
    return this.client
      .db('statistics')
      .collection<Progress>('progress')
      .findOne({}, { session: session });
  }
  private async getTodoInstitutions(): Promise<any> {
    const session = this.client.startSession();
    return this.client
      .db('statistics')
      .collection('todoInstitutions')
      .findOne({}, { session: session });
  }
  private async checkIfRunning(): Promise<boolean> {
    const session = this.client.startSession();
    await this.client
      .db('statistics')
      .collection('running')
      .deleteOne({}, { session: session });
    const awaitTimeout = (delay: number) =>
      new Promise((resolve) => setTimeout(resolve, delay));
    await awaitTimeout(5000);
    return !!(await this.client
      .db('statistics')
      .collection('running')
      .findOne({}, { session: session }));
  }*/

  /*private async getInstitutions(): Promise<Institution[]> {
    const session = this.client.startSession();

    const insts = this.client
      .db('statistics')
      .collection<Institution>('institutions')
      .find({ num_orgs: { $ne: 0 } }, { session: session })
      .toArray();
    this.institutionSearchStrings = (await insts).map((value) => {
      return JSON.stringify(value);
    });
    return insts;
  }*/
  /*private async getRepositories(): Promise<Repository[]> {
    const session = this.client.startSession();
    let repositories = this.client
      .db('statistics')
      .collection<Repository>('repositories')
      .find(
        {},
        {
          projection: {
            commit_activities: 0,
          },
          session: session,
        },
      )
      .toArray();
    (await repositories).forEach((repository) => {
      repository.logo = `https://github.com/${repository.organization}.png`;
      this.updateDate =
        this.updateDate.getTime() > repository.timestamp.getTime()
          ? repository.timestamp
          : repository.timestamp;
    });
    this.repositorySearchStrings = (await repositories).map((value) => {
      return JSON.stringify(value);
    });
    return repositories;
  }*/
  /*private async getUsers(): Promise<User[]> {
    const session = this.client.startSession();
    let users = this.client
      .db('statistics')
      .collection<User>('users')
      .find({}, { session: session })
      .toArray();
    this.userSearchStrings = (await users).map((value) => {
      return JSON.stringify(value);
    });
    return users;
  }*/

  /*private async getData() {
    console.log('Loading data...');
    this.institutions = await this.getInstitutions();
    console.log('Loaded institutions');
    this.repositories = await this.getRepositories();
    console.log('Loaded repositories');
    this.users = await this.getUsers();
    console.log('Loaded users');
  }*/
}
