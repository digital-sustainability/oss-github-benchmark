import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
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
} from 'src/interfaces';
import { DataGathering } from 'src/data-gathering/data-gathering';

@Injectable()
export class MongoDbService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(private dataGathering: DataGathering) {}
  async onApplicationShutdown(signal?: string) {
    await this.destroyConnection();
  }
  async onApplicationBootstrap() {
    await this.initializeConnection();
    if (process.env.NODE_ENV === 'production') this.dataGathering.startScript();
    this.getCrawlerStatus().then(() => console.log('Loaded crawler status'));
    setInterval(() => {
      this.getCrawlerStatus().then(() => console.log('Loaded crawler status'));
    }, 180000);
    this.getData().then(() => console.log('Loaded data'));
    setInterval(() => {
      this.getData().then(() => console.log('Reloaded data'));
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
  private updateDate: Date = new Date();

  private async initializeConnection() {
    if (this.client !== undefined) return;
    this.client = new MongoClient(process.env.MONGO_READ, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    await this.client.connect();
  }
  private async destroyConnection() {
    if (!this.client) return;
    await this.client.close();
    this.client = undefined;
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
    if (params.findName) {
      return this.institutions.find((inst) => {
        return inst.shortname === params.findName;
      });
    }
    let sectors: { [key: string]: number } = {};
    let insts = this.institutions;
    if (params.search.length > 0)
      insts = insts.filter((institution: Institution, index) => {
        const search: string = this.institutionSearchStrings[index];
        return search.toLowerCase().includes(params.search.toLowerCase());
      });
    insts.forEach((institution) => {
      sectors[institution.sector] = (sectors[institution.sector] ?? 0) + 1;
    });
    if (params.sector.length > 0)
      insts = insts.filter((institution: Institution) => {
        return params.sector.includes(institution.sector);
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
      .find({ num_orgs: { $ne: 0 } }, { session: session })
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
    console.log('Loading data...');
    this.institutions = await this.getInstitutions();
    console.log('Loaded institutions');
    this.repositories = await this.getRepositories();
    console.log('Loaded repositories');
    this.users = await this.getUsers();
    console.log('Loaded users');
  }
  private async getCrawlerStatus() {
    const progress = await this.getProgress();
    const todos = await this.getTodoInstitutions();
    const running = await this.checkIfRunning();
    const currentInstitution: string =
      todos.githubrepos[progress.currentSector][1].institutions[
        progress.currentInstitution - 1
      ].name_de;
    let orgs: string[] = [];
    todos.githubrepos.forEach((sector) => {
      sector[1].institutions.forEach((institution) => {
        institution.orgs.forEach((org) => {
          orgs.push(org);
        });
      });
    });
    const percentile =
      Math.round(
        (orgs.indexOf(
          todos.githubrepos[progress.currentSector][1].institutions[
            progress.currentInstitution - 1
          ].orgs[0],
        ) /
          orgs.length) *
          10000,
      ) / 100;
    this.status = {
      currentSectorNO: progress.currentSector,
      currentInstitutionNO: progress.currentInstitution - 1,
      currentInstitutionName: currentInstitution,
      running: running,
      progress: percentile,
      lastUpdated: this.updateDate,
    };
  }
}
