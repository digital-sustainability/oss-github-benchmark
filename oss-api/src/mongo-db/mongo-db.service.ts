import {
  Injectable,
  Logger,
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
  Contributor,
  RepositoryRevised,
  OrganisationRevised,
  InstitutionRevised,
  InstitutionSummary,
  UserSummary,
  RepositorySummary,
  SingleInstitutionResponse,
} from 'src/interfaces';

enum Tables {
  institutions = 'institutions',
  organisations = 'organisation',
  repositories = 'repositoriesNew',
  todoInstitutions = 'todoInstitutions',
  contributors = 'contributors',
}

@Injectable()
export class MongoDbService implements OnApplicationShutdown, OnModuleInit {
  constructor() {}
  async onApplicationShutdown(signal?: string) {
    await this.destroyConnection();
  }

  async onModuleInit() {
    this.database = process.env.MONGO_DATABASE || 'testing';
    await this.initializeConnection();
  }

  private database: string;
  //private client: MongoClient | undefined;
  private client: MongoClient;
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
      .createIndex({ '$**': 'text' }, { default_language: 'none' });
    this.client
      .db(this.database)
      .collection('repositoriesNew')
      .createIndex({ '$**': 'text' }, { default_language: 'none' });
    this.client
      .db(this.database)
      .collection('contributors')
      .createIndex({ '$**': 'text' }, { default_language: 'none' });
  }
  private async destroyConnection() {
    if (!this.client) return;
    await this.client.close();
    this.client = undefined;
  }

  /***********************************Create************************************************/

  /***********************************Read**************************************************/

  /**
   * Find a repository with its name and the name of the institution
   * @param repoName The name of the repository
   * @param institutionName The name of the owning institution
   * @returns The found repository
   */
  async findRepository(
    repoName: string,
    institutionName: string,
  ): Promise<Repository> {
    // this.logger.log(
    //   `Searching the repository with the name ${repoName} from the institution ${institutionName}`,
    // );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .findOne({ name: repoName, institution: institutionName });
  }

  /**
   * Get all the todo institutions from the database
   * @returns A TodoInstitution array
   */
  async findAllTodoInstitutions(): Promise<TodoInstitution[]> {
    // this.logger.log(`Getting all the todo institutions from the database`);
    const session = await this.client.startSession();
    return this.client
      .db(this.database)
      .collection<TodoInstitution>(Tables.todoInstitutions)
      .find(
        {},
        {
          session,
        },
      )
      .toArray();
  }

  /**
   * Find all institutions based on the condition array
   * @param sortKey The value for the sorting
   * @param direction The direction to sort
   * @param limit The limit of how many elements should be returned
   * @param page The page of the elements, based on the limit
   * @param includeForks If forked repos should be included in the response or not
   * @param conditions The conditions for the search
   * @returns A InstitutionSummarry array with the matched elements
   */
  async findInstitutionsWithConditions(
    sortKey: string,
    direction: 1 | -1,
    limit: number,
    page: number,
    includeForks: boolean,
    conditions: Object[],
  ): Promise<InstitutionSummary[]> {
    // this.logger.log(
    //   `Searching for institutions with these conditions: ${conditions.toString()}`,
    // );
    return this.client
      .db(this.database)
      .collection<InstitutionSummary>(Tables.institutions)
      .aggregate([
        {
          $match: {
            $and: conditions,
          },
        },
        {
          $lookup: {
            from: 'organisation',
            localField: 'orgs',
            foreignField: '_id',
            as: 'orga',
          },
        },
        { $unwind: { path: '$orga', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'repositoriesNew',
            localField: 'orga.repos',
            foreignField: '_id',
            as: 'repo',
          },
        },
        {
          $project: {
            shortname: 1,
            name_de: 1,
            avatar: 1,
            sector: 1,
            orga: 1,
            repo: {
              $cond: [
                { $eq: [includeForks, true] },
                '$repo',
                {
                  $filter: {
                    input: '$repo',
                    as: 'repository',
                    cond: {
                      $eq: ['$$repository.fork', false],
                    },
                  },
                },
              ],
            },
          },
        },
        { $unwind: { path: '$repo', preserveNullAndEmptyArrays: true } },
        { $sort: { 'orga.created_at': 1 } },
        {
          $group: {
            _id: '$_id',
            shortname: { $first: '$shortname' },
            name_de: { $first: '$name_de' },
            num_repos: { $count: {} },
            members: { $push: '$repo.contributors' },
            forks: { $push: '$repo.fork' },
            avatar: { $first: { $first: '$avatar' } },
            sector: { $first: '$sector' },
            repo_names: { $push: '$repo.name' },
            location: { $first: '$orga.locations' },
            created_at: { $first: '$orga.created_at' },
          },
        },
        {
          $set: {
            total_num_forks_in_repos: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$forks',
                    cond: '$$this',
                  },
                },
              },
            },
            num_members: {
              $size: {
                $setUnion: [
                  {
                    $reduce: {
                      input: '$members',
                      initialValue: [],
                      in: { $concatArrays: ['$$value', '$$this'] },
                    },
                  },
                  [],
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            shortname: 1,
            name_de: 1,
            num_repos: 1,
            num_members: 1,
            total_num_forks_in_repos: 1,
            avatar: 1,
            sector: 1,
            repo_names: 1,
            location: 1,
            created_at: 1,
          },
        },
        {
          $sort: { [sortKey]: direction },
        },
        {
          $skip: limit * page,
        },
        {
          $limit: limit,
        },
      ])
      .toArray() as Promise<InstitutionSummary[]>;
  }

  /**
   * Count all the institutions matching to the given conditions
   * @param conditions The condition array
   * @returns A GroupCount Object array
   */
  async countInstitutionsWithConditions(
    conditions: Object[],
  ): Promise<GroupCount[]> {
    // this.logger.log(
    //   `Counting institutions corresponding with these conditions: ${conditions.toString()}`,
    // );
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.institutions)
      .aggregate([
        {
          $match: {
            $and: conditions,
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
   * Find repositories with given conditions
   * @param key The sorting key
   * @param direction In which direction to sort
   * @param limit The limit of the returned items
   * @param page The page of the reults
   * @param conditions The conditions for the filtering
   * @returns An Array with the repositories
   */
  async findRepositoryWithConditions(
    key: string,
    direction: 1 | -1,
    limit: number,
    page: number,
    conditions: Object[],
  ): Promise<RepositorySummary[]> {
    // this.logger.log(
    //   `Getting all the repositories with the conditions: ${conditions.toString()}`,
    // );
    return this.client
      .db(this.database)
      .collection<RepositorySummary>(Tables.repositories)
      .aggregate([
        {
          $match: {
            $and: conditions,
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            uuid: 1,
            url: 1,
            institution: 1,
            organization: 1,
            description: 1,
            fork: { $toString: '$fork' },
            num_forks: {
              $getField: {
                field: 'num_forks',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            num_contributors: {
              $getField: {
                field: 'num_contributors',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            num_commits: {
              $getField: {
                field: 'num_commits',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            num_stars: {
              $getField: {
                field: 'num_stars',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            num_watchers: {
              $getField: {
                field: 'num_watchers',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            has_own_commits: {
              $getField: {
                field: 'has_own_commits',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            issues_closed: {
              $getField: {
                field: 'issues_closed',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            issues_all: {
              $getField: {
                field: 'issues_all',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            pull_requests_closed: {
              $getField: {
                field: 'pull_requests_closed',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            pull_requests_all: {
              $getField: {
                field: 'pull_requests_all',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            comments: {
              $getField: {
                field: 'comments',
                input: { $arrayElemAt: ['$stats', -1] },
              },
            },
            timestamp: 1,
            license: 1,
            created_at: 1,
            updated_at: 1,
            logo: 1,
            archived: 1,
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
      .toArray() as Promise<RepositorySummary[]>;
  }

  /**
   * Count all repositories with given conditions
   * @param condition The conditions to filter with
   * @returns The count of found users
   */
  async countAllRepositoriesWithConditions(
    condition: Object[],
  ): Promise<ObjectCount[]> {
    // this.logger.log(
    //   `Counting repositories corresponding with these conditions: ${condition.toString()}`,
    // );
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .aggregate([
        {
          $match: {
            $and: condition,
          },
        },
        {
          $count: 'total',
        },
      ])
      .toArray() as Promise<ObjectCount[]>;
  }

  /**
   * Find users with given conditions
   * @param key The key to sort with
   * @param direction The direction to sort
   * @param limit The limit of answers
   * @param page The page of the answers
   * @param condition The conditions to filter
   * @returns An Array of users matching the conditions
   */
  async findUsersWithConditions(
    key: string,
    direction: 1 | -1,
    limit: number,
    page: number,
    condition: Object,
  ): Promise<UserSummary[]> {
    // this.logger.log(
    //   `Searching for users in the database with the conditions: ${condition.toString()}`,
    // );
    return this.client
      .db(this.database)
      .collection<User>(Tables.contributors)
      .aggregate([
        {
          $match: condition,
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
      .toArray() as Promise<UserSummary[]>;
  }

  async createNewTodoInstitution(institution: TodoInstitution) {
    return await this.client
      .db(this.database)
      .collection<TodoInstitution>(Tables.todoInstitutions)
      .replaceOne({ uuid: institution.uuid }, institution, { upsert: true });
  }

  /**
   * Count all users with the given condtions
   * @param conditions The conditions to filter with
   * @returns The number of users matching
   */
  async countAllUsersWithConditions(conditions: Object): Promise<number> {
    // this.logger.log(
    //   `Counting users corresponding with this conditions: ${conditions}`,
    // );
    return (
      await this.client
        .db(this.database)
        .collection<User>(Tables.contributors)
        .aggregate([
          {
            $match: conditions,
          },
          {
            $count: 'total',
          },
        ])
        .toArray()
    )[0].total as Promise<number>;
  }

  /**
   * Get the latest crawl date
   * @returns The latest crawl date as array
   */
  async latestUpdate() {
    // this.logger.log('Getting the latest crawl run date');
    return this.client
      .db(this.database)
      .collection(Tables.institutions)
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

  /**
   * Get all users from the database
   * @returns A array with all the users
   */
  async getAllUsers(): Promise<User[]> {
    // this.logger.log('Getting all the users');
    return this.client
      .db(this.database)
      .collection<User>(Tables.contributors)
      .find({})
      .toArray();
  }

  /**
   * Get all the repositories from the database
   * @returns A array with all the repositories
   */
  async getAllRepositories(): Promise<Repository[]> {
    // this.logger.log('Getting all the repositories');
    return this.client
      .db(this.database)
      .collection<Repository>(Tables.repositories)
      .find({})
      .toArray();
  }

  /**
   * Get the revised repository entry with the uuid
   * @param uuid The uuid of the repository
   * @returns The found repository
   */
  async getRevisedRepositoryWithUuid(uuid: string): Promise<RepositoryRevised> {
    // this.logger.log(`Getting the data of the revised repository ${uuid}`);
    return this.client
      .db(this.database)
      .collection<RepositoryRevised>(Tables.repositories)
      .findOne({ uuid: uuid });
  }

  /**
   * Get all the contributors of a repository
   * @param contributorLogins The logins of all contributors
   * @returns A list with all the found contributors
   */
  async findRepositoryContributors(
    contributorLogins: string[],
  ): Promise<Contributor[]> {
    // this.logger.log('Getting all the contributors of the repository');
    return this.client
      .db(this.database)
      .collection<Contributor>(Tables.contributors)
      .find({ login: { $in: contributorLogins } })
      .toArray();
  }

  /**
   * Get all organisations from the database
   * @returns An array with all the organisations
   */
  async getAllOrganisations(): Promise<Organisation[]> {
    // this.logger.log('Getting all the organisations from the database');
    return this.client
      .db(this.database)
      .collection<Organisation>(Tables.organisations)
      .find({})
      .toArray();
  }

  /**
   * Get all the organisation repositories
   * @param repositoryUuid The repositories uuid
   * @returns All the found repositories
   */
  async findOrganisationRepositories(
    repositoryUuid: string[],
  ): Promise<RepositoryRevised[]> {
    // this.logger.log('Getting the all the repositories of the organisation');
    return this.client
      .db(this.database)
      .collection<RepositoryRevised>(Tables.repositories)
      .find({ uuid: { $in: repositoryUuid } })
      .toArray();
  }

  /**
   * Get all the institutions from the database
   * @returns An array with all institutions
   */
  async getAllInstitutions(): Promise<Institution[]> {
    // this.logger.log('Getting all the institutions');
    return this.client
      .db(this.database)
      .collection<Institution>(Tables.institutions)
      .find({})
      .toArray();
  }

  /**
   *
   * @param organisationNames
   */
  async findInstitutionOrganisations(
    organisationNames: string[],
  ): Promise<OrganisationRevised[]> {
    // this.logger.log('Getting all the organisations of the institution');
    return this.client
      .db(this.database)
      .collection<OrganisationRevised>(Tables.organisations)
      .find({ name: { $in: organisationNames } })
      .toArray();
  }

  /**
   * Get all users from the database
   * @returns A array with all the users
   */
  async searchContributors(
    contributorLogins: string[],
  ): Promise<Contributor[]> {
    // this.logger.log(
    // `Getting all the contributor with the logins: ${contributorLogins.toString()}`,
    // );
    return this.client
      .db(this.database)
      .collection<Contributor>(Tables.contributors)
      .find({ login: { $in: contributorLogins } })
      .toArray();
  }

  /**
   * Find repositories
   * @param repoName The repository name
   * @param institutionName The institution name
   * @returns The found repository
   */
  async findRepositoryRevised(
    repoName: string,
    institutionName: string,
  ): Promise<RepositoryRevised> {
    // this.logger.log(
    //   `Searching the repository with the name ${repoName} from the institution ${institutionName}`,
    // );
    return this.client
      .db(this.database)
      .collection<RepositoryRevised>(Tables.repositories)
      .findOne({ name: repoName, institution: institutionName });
  }

  /**
   * Find all repositories of an organisation
   * @param organisationName The organisation name
   * @returns The found repositories
   */
  async findAllOrganisationRepository(
    organisationName: string,
  ): Promise<RepositoryRevised[]> {
    // this.logger.log(
    //   `Find all repositories in the organisation ${organisationName}`,
    // );
    return this.client
      .db(this.database)
      .collection<RepositoryRevised>(Tables.repositories)
      .find({ organization: organisationName })
      .toArray();
  }

  /**
   * Get all organisations from their names
   * @param organisationNames The names of the organisations
   * @returns The found organisations
   */
  public async findOrganisationsWithNames(
    organisationNames: string[],
  ): Promise<OrganisationRevised[]> {
    // this.logger.log(
    //   `Getting all organisations with the names: ${organisationNames}`,
    // );
    return this.client
      .db(this.database)
      .collection<OrganisationRevised>(Tables.organisations)
      .find({ name: { $in: organisationNames } })
      .toArray();
  }

  /**
   * Get an institution by its shortname
   * @param institutionShortName The shortname of the institution
   * @returns An array containing the Institution
   */
  public async findInstitutionWithShortName(
    institutionShortName: string,
  ): Promise<SingleInstitutionResponse[]> {
    this.logger.log(
      `Searching for an institution with the shortname: ${institutionShortName}`,
    );

    return this.client
      .db(this.database)
      .collection<SingleInstitutionResponse>(Tables.institutions)
      .aggregate(
        [
          {
            $match: {
              shortname: institutionShortName,
            },
          },
          {
            $lookup: {
              from: 'organisation',
              localField: 'orgs',
              foreignField: '_id',
              as: 'orga',
            },
          },
          {
            $set: {
              orgs: '$orga',
            },
          },
          { $unwind: { path: '$orga', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'repositoriesNew',
              localField: 'orga.repos',
              foreignField: '_id',
              as: 'repo',
            },
          },
          { $unwind: { path: '$repo', preserveNullAndEmptyArrays: true } },
          { $sort: { 'orga.created_at': 1 } },
          {
            $group: {
              _id: '$_id',
              shortname: { $first: '$shortname' },
              name_de: { $first: '$name_de' },
              num_repos: { $count: {} },
              members: { $push: '$repo.contributors' },
              forks: { $push: '$repo.fork' },
              avatar: { $first: { $first: '$avatar' } },
              sector: { $first: '$sector' },
              repo_names: { $push: '$repo.name' },
              location: { $first: '$orga.locations' },
              created_at: { $first: '$orga.created_at' },
              stats: { $push: { $last: '$repo.stats' } },
              orgs: { $first: '$orgs' },
            },
          },
          {
            $set: {
              total_num_forks_in_repos: {
                $sum: {
                  $size: {
                    $filter: {
                      input: '$forks',
                      cond: '$$this',
                    },
                  },
                },
              },
              num_members: {
                $size: {
                  $setUnion: [
                    {
                      $reduce: {
                        input: '$members',
                        initialValue: [],
                        in: { $concatArrays: ['$$value', '$$this'] },
                      },
                    },
                    [],
                  ],
                },
              },
              total_num_contributors: { $sum: '$stats.num_contributors' },
              total_num_commits: { $sum: '$stats.num_commits' },
              total_pull_requests: { $sum: '$stats.pull_requests_all' },
              total_issues: { $sum: '$stats.issues_all' },
              total_num_stars: { $sum: '$stats.num_stars' },
              total_num_watchers: { $sum: '$stats.num_watchers' },
              total_pull_requests_closed: {
                $sum: '$stats.pull_requests_closed',
              },
              total_issues_closed: { $sum: '$stats.issues_closed' },
              total_comments: { $sum: '$stats.comments' },
              num_orgs: { $size: '$orgs' },
            },
          },
          {
            $project: {
              _id: 0,
              avatar: 1,
              sector: 1,
              shortname: 1,
              num_repos: 1,
              num_members: 1,
              total_num_contributors: 1,
              total_num_forks_in_repos: 1,
              total_num_commits: 1,
              total_pull_requests: 1,
              total_issues: 1,
              total_num_stars: 1,
              total_num_watchers: 1,
              total_pull_requests_closed: 1,
              total_issues_closed: 1,
              total_comments: 1,
              num_orgs: 1,
              orgs: 1,
            },
          },
        ],
        /* {
          allowDiskUse: true,
        }, */
      )
      .toArray() as Promise<SingleInstitutionResponse[]>;
  }

  /***********************************Update************************************************/

  /**
   * Upsert a contributor
   * @param contributor The contributor object
   */
  async upsertContributor(contributor: Contributor): Promise<void> {
    // this.logger.log(`Upserting contributor ${contributor.login}`);
    this.client
      .db(this.database)
      .collection<Contributor>(Tables.contributors)
      .replaceOne(
        { login: contributor.login },
        { ...contributor },
        { upsert: true },
      );
  }

  /**
   * Upsert the revised repository
   * @param repo The revised repository object
   */
  async upsertRevisedRepository(repo: RepositoryRevised): Promise<void> {
    // this.logger.log(`Upserting repository ${repo.name}`);
    this.client
      .db(this.database)
      .collection<RepositoryRevised>(Tables.repositories)
      .replaceOne(
        { name: repo.name, institution: repo.institution },
        { ...repo },
        { upsert: true },
      );
  }

  /**
   * Upsert a organisation with the new data
   * @param organisation The organistion to upsert
   */
  async upsertRevisedOrganisation(
    organisation: OrganisationRevised,
  ): Promise<void> {
    // this.logger.log(`Upserting organisation ${organisation.name}`);
    this.client
      .db(this.database)
      .collection<OrganisationRevised>(Tables.organisations)
      .replaceOne(
        { name: organisation.name },
        { ...organisation },
        { upsert: true },
      );
  }

  /**
   * Upsert a institution
   * @param instituion The institution to upsert
   */
  async upsertRevisedInstitution(
    instituion: InstitutionRevised,
  ): Promise<void> {
    // this.logger.log(`Upserting institution ${instituion.name_de}`);
    this.client
      .db(this.database)
      .collection<InstitutionRevised>(Tables.institutions)
      .replaceOne(
        { uuid: instituion.uuid },
        { ...instituion },
        { upsert: true },
      );
  }

  /**
   * Update the timestamp of a todo institution
   * @param uuid The institution uuid
   */
  async updateTodoInstitutionTimestamp(uuid: string): Promise<void> {
    this.logger.log(
      `Updating timestamp of the institution with the uuid ${uuid}.`,
    );
    this.client
      .db(this.database)
      .collection<TodoInstitution>('todoInstitutions')
      .updateOne({ uuid: uuid }, { $set: { ts: new Date() } });
  }

  /**
   * Update all org timestamps of a todo institution
   * @param institution The todo institution object
   */
  async updateOrgTimestamp(institution: TodoInstitution): Promise<void> {
    // this.logger.log(
    //   `Updating timestamp of all orgs of the instituion ${institution.uuid}`,
    // );
    this.client
      .db(this.database)
      .collection<TodoInstitution>('todoInstitutions')
      .updateOne(
        { uuid: institution.uuid },
        { $set: { orgs: institution.orgs } },
      );
  }

  /***********************************Delete************************************************/
}

/*Stats

6 DBs
11 Collections

Hosts

cluster0-shard-00-01.bq03p.mongodb.net:27017
cluster0-shard-00-02.bq03p.mongodb.net:27017
cluster0-shard-00-00.bq03p.mongodb.net:27017

Cluster

Replica Set atlas-cqy6i5-shard-0
3 Nodes

Edition

MongoDB 7.0.8 Atlas



Stats

4 DBs
9 Collections

Host

localhost:27017

Cluster

Standalone

Edition

MongoDB 5.0.26 Community


*/
