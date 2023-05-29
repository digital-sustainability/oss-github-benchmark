import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { RawResponse } from '../interfaces';
import { GithubUser } from '../interfaces';
import { Contributor } from '../interfaces';
import { MongoDbService } from '../mongo-db/mongo-db.service';

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
    const repositoryFileNames: string[] = fileNames.map((fileName) => {
      if (fileName.includes('repository')) return fileName;
    });
    const organisationFileNames: string[] = fileNames.map((fileName) => {
      if (fileName.includes('organisation')) return fileName;
    });
    contributorFileNames.forEach((contributorFileName) => {
      this.handleContributor(contributorFileName);
    });
    // remove user files
    // read all repo files
    // handle repo
    // remove all repo files
    // read all org files
    // handle org
    // remove all org files
    // update institution
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
    this.logger.log(`Reading file at path ${path}`);
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
}
