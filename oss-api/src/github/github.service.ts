import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { OctokitResponse, Endpoints } from '@octokit/types';
import { GithubResponse, GithubUser } from 'src/interfaces';

@Injectable()
export class GithubService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  async onApplicationBootstrap() {
    await this.intializeConnection();
  }
  async onApplicationShutdown(signal?: string) {
    await this.destroyConnection();
  }

  private octokit: Octokit;

  /**
   * Intialize the connection to Github.
   * Important: The GITHUB_TOKEN env var must be set!
   */
  private async intializeConnection() {
    if (this.octokit !== undefined) return;
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  /**
   * Destroy connection to github
   */
  private async destroyConnection() {
    if (!this.octokit) return;
    this.octokit = undefined;
  }

  /***************************************User Calls**************************************************/

  /**
   * Get the data of the specified user from github.
   * @param username The username
   * @returns A promise of the type OcktokitResponse
   */
  async get_User(username: string): Promise<OctokitResponse<any>> {
    return this.octokit.users.getByUsername({
      username: username,
    });
  }

  /**********************************Repository Calls**************************************************/
}
