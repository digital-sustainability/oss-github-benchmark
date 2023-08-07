import { Injectable, Logger } from '@nestjs/common';
import { MongoDbService } from '../mongo-db/mongo-db.service';
import {
  Contributor,
  InstitutionRevised,
  Institution,
  Organisation,
  OrganisationRevised,
  Repository,
  RepositoryRevised,
  RepositoryStats,
  User,
} from '../interfaces';
import { ObjectId } from 'mongodb';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TransformerService {
  private readonly logger = new Logger(TransformerService.name);

  constructor(private mongo: MongoDbService) {}
  async onApplicationBootstrap() {
    //this.prepareData();
  }

  private async prepareData() {
    this.logger.log('Preparing all the user data');
    const users = await this.mongo.getAllUsers();
    for (const user of users) {
      await this.handleUser(user);
    }
    this.logger.log('Preparing all the repository data');
    const repositories = await this.mongo.getAllRepositories();
    for (const repository of repositories) {
      await this.handleRepository(repository);
    }
    this.logger.log('Preparing all the organisation data');
    const organisations = await this.mongo.getAllOrganisations();
    for (const organisation of organisations) {
      await this.handleOrganisation(organisation);
    }
    this.logger.log('Preparing all the institution data');
    const institutitions = await this.mongo.getAllInstitutions();
    for (const insitution of institutitions) {
      if (insitution.shortname !== '3ap') continue;
      await this.handleInstitution(insitution);
      break;
    }
  }

  /**
   * Handle the user data
   * @param user The old user data
   */
  private async handleUser(user: User) {
    this.logger.log(`Handling user ${user.login}`);
    const contributor = this.createContributor(user);
    await this.mongo.upsertContributor(contributor);
  }

  /**
   * Create a contributor object
   * @param user The old user object
   * @returns The new contributor object
   */
  private createContributor(user: User): Contributor {
    this.logger.log(`Creating contributor ${user.login}`);
    const contributor: Contributor = {
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
      public_repos: user.public_repos,
      public_gists: user.public_gists,
      followers: user.followers,
      following: user.following,
    };
    return contributor;
  }

  /**
   * Handle the repository data
   * @param repo The repository
   */
  private async handleRepository(repo: Repository) {
    this.logger.log(`Handling repository ${repo.name}`);
    const dbRepo = await this.mongo.getRevisedRepositoryWithUuid(repo.uuid);
    const stats: RepositoryStats[] = dbRepo ? dbRepo.stats : [];
    stats.push(this.createRepositoryStats(repo));
    const contributors: Contributor[] =
      await this.mongo.findRepositoryContributors(repo.contributors);
    const contributorIds: ObjectId[] = contributors.map(
      (contributor) => contributor['_id'],
    );
    const repostory = this.createRepository(repo, contributorIds, stats);
    await this.mongo.upsertRevisedRepository(repostory);
  }

  /**
   * Create a new repository object
   * @param repo The old repository
   * @param contributors The contributors of the repository
   * @param repositoryStats The statistics object of the repository
   * @returns A revised Repository object
   */
  private createRepository(
    repo: Repository,
    contributors: ObjectId[],
    repositoryStats: RepositoryStats[],
  ): RepositoryRevised {
    this.logger.log(`Creating new repository object for the repo ${repo.name}`);
    const repository: RepositoryRevised = {
      name: repo.name,
      uuid: repo.uuid,
      url: repo.url,
      institution: repo.institution,
      organization: repo.organization,
      description: repo.description,
      fork: repo.fork,
      archived: repo.archived,
      timestamp: repo.timestamp,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      contributors: contributors,
      coders: repo.coders,
      license: repo.license,
      stats: repositoryStats,
      logo: repo.logo,
    };
    return repository;
  }

  /**
   * Create a new repository stats object
   * @param repo The repository object
   * @returns A Repository stats object
   */
  private createRepositoryStats(repo: Repository): RepositoryStats {
    this.logger.log('Creating new Repository Stats object');
    const stats: RepositoryStats = {
      num_forks: repo.num_forks,
      num_contributors: repo.num_contributors,
      num_commits: repo.num_commits,
      num_stars: repo.num_stars,
      num_watchers: repo.num_watchers,
      has_own_commits: repo.has_own_commits,
      issues_closed: repo.issues_closed,
      issues_all: repo.issues_all,
      pull_requests_closed: repo.pull_requests_closed,
      pull_requests_all: repo.pull_requests_all,
      comments: repo.comments,
      languages: repo.languages,
    };
    return stats;
  }

  /**
   * Handle the organisation data
   * @param organisation The Organisation to handle
   */
  private async handleOrganisation(organisation: Organisation) {
    this.logger.log(`Handling organisation ${organisation.name}`);
    const foundRepos = await this.mongo.findOrganisationRepositories(
      organisation.repos,
    );
    const repoIds: ObjectId[] = foundRepos.map((foundRepo) => foundRepo['_id']);
    const newOrganisation = this.createOrganisation(organisation, repoIds);
    await this.mongo.upsertRevisedOrganisation(newOrganisation);
  }

  /**
   * Create a revised organisation object
   * @param orga The old organisation
   * @param repositories The repositories ob the organisation
   * @returns The new organisation object
   */
  private createOrganisation(
    orga: Organisation,
    repositories: ObjectId[],
  ): OrganisationRevised {
    const organisation: OrganisationRevised = {
      name: orga.name,
      url: orga.url,
      description: orga.description,
      avatar: orga.avatar,
      created_at: orga.created_at,
      locations: orga.location,
      email: orga.email,
      repos: repositories,
    };
    return organisation;
  }

  /**
   * Handle the old institution data
   * @param instituion The data to be handled
   */
  private async handleInstitution(instituion: Institution): Promise<void> {
    this.logger.log(`Handling institution ${instituion.name_de}`);
    const foundOrgas = await this.mongo.findInstitutionOrganisations(
      instituion.org_names,
    );
    const orgaIds: ObjectId[] = foundOrgas.map((foundOrga) => foundOrga['_id']);
    const newInstitution = this.createInstitution(instituion, orgaIds);
    this.mongo.upsertRevisedInstitution(newInstitution);
  }

  /**
   * Create a new institution Object
   * @param institution The old institution object
   * @param orgaIds The corresponding orga ids
   * @returns A revised institution object
   */
  private createInstitution(
    institution: Institution,
    orgaIds: ObjectId[],
  ): InstitutionRevised {
    const newInstitution: InstitutionRevised = {
      uuid: institution.uuid,
      shortname: institution.shortname,
      name_de: institution.name_de,
      orgs: orgaIds,
      avatar: institution.avatar,
      timestamp: institution.timestamp,
      sector: institution.sector,
    };
    return newInstitution;
  }
}
