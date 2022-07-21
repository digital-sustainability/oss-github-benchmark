import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { MongoClient, ConnectOptions } from 'mongodb';
import { connected } from 'process';
import {
  Institution,
  Repository,
  User,
  Status,
  Progress,
  InstitutionQueryConfig,
  UserQueryConfig,
  RepositoryQueryConfig,
} from 'src/interfaces';

@Injectable()
export class MongoDbService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    await this.getCrawlerStatus();
    setInterval(async () => {
      await this.getCrawlerStatus();
    }, 60000);
    await this.getData();
    setInterval(async () => {
      await this.getData();
    }, 3600000);
  }

  private client: MongoClient | undefined;
  private institutions: Institution[] | undefined;
  private repositories: Repository[] | undefined;
  private users: User[] | undefined;
  private status: Status | undefined;
  private institutionSearchStrings: string[];
  private repositorySearchStrings: string[];
  private userSearchStrings: string[];

  private async initializeConnection() {
    this.client = new MongoClient(process.env.MONGO_READ, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    await this.client.connect();
  }
  private async destroyConnection() {
    this.client.close();
  }

  async findAllInstitutions() {
    return this.institutions;
  }
  async findAllRepositories() {
    return this.repositories;
  }
  async findAllUsers() {
    return this.users;
  }
  async findStatus() {
    return this.status;
  }

  async findInstitutions(params: InstitutionQueryConfig) {
    let insts = this.institutions;
    if (params.sector.length > 0)
      insts = insts.filter((institution: Institution) => {
        return params.sector.includes(institution.sector);
      });
    if (params.search.length > 0)
      insts = insts.filter((institution: Institution, index) => {
        const search: string = this.institutionSearchStrings[index];
        return search.toLowerCase().includes(params.search.toLowerCase());
      });
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
    if (params.sendStats) {
      return insts.slice(
        params.page * params.count,
        (params.page + 1) * params.count,
      );
    } else {
      insts.slice(params.page * params.count, (params.page + 1) * params.count);
      const institutionsWithoutStats: Institution[] = insts.map(
        (inst: Institution) => {
          const { stats, ...institutionWithoutStats } = inst;
          return institutionWithoutStats;
        },
      );
      return institutionsWithoutStats;
    }
  }
  async findRepositories(params: RepositoryQueryConfig) {
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
  }
  async findUsers(params: UserQueryConfig) {
    let users = this.users;
    if (params.search.length > 0)
      users = users.filter((user: User, index) => {
        const search: string = this.userSearchStrings[index];
        if (!search) return console.log(this.users[index]);
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
  }

  private async getProgress(): Promise<undefined | Progress> {
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
  }

  private async getInstitutions(): Promise<Institution[]> {
    const session = this.client.startSession();
    let insts = this.client
      .db('statistics')
      .collection<Institution>('institutions')
      .find({}, { session: session })
      .toArray();
    this.institutionSearchStrings = (await insts).map((value) => {
      return JSON.stringify(value);
    });
    return insts;
  }
  private async getRepositories(): Promise<Repository[]> {
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
    this.repositorySearchStrings = (await repositories).map((value) => {
      return JSON.stringify(value);
    });
    return repositories;
  }
  private async getUsers(): Promise<User[]> {
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
  }

  private async getData() {
    console.log('(Re)loading data...');
    await this.initializeConnection();
    this.institutions = await this.getInstitutions();
    this.repositories = await this.getRepositories();
    this.users = await this.getUsers();
    await this.destroyConnection();
    console.log('Data loaded.');
  }
  private async getCrawlerStatus() {
    await this.initializeConnection();
    const progress = await this.getProgress();
    const todos = await this.getTodoInstitutions();
    const running = await this.checkIfRunning();
    const currentInstitution: string =
      todos.githubrepos[progress.currentSector][1].institutions[
        progress.currentInstitution
      ].name_de;
    this.status = {
      currentSectorNO: progress.currentSector,
      currentInstitutionNO: progress.currentInstitution,
      currentInstitutionName: currentInstitution,
      running: running,
    };
    await this.destroyConnection();
  }
}
