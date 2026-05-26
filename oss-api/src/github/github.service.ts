import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { OctokitResponse } from '@octokit/types';

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

  async get_RateLimit(): Promise<OctokitResponse<any>> {
    return this.octokit.rest.rateLimit.get();
  }

  /***************************************User Calls**************************************************/

  /**
   * Get the data of the specified user from github.
   * @param username The username
   * @returns A promise of the type OcktokitResponse
   */
  async get_User(username: string): Promise<OctokitResponse<any>> {
    return this.octokit.rest.users.getByUsername({
      username: username,
    });
  }

  /**********************************Repository Calls**************************************************/

  /**
   * Get the data of the specified repository from github
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @returns A promise of the type OcktokitResponse
   */
  async get_Repository(
    owner: string,
    repoName: string,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.get({
      owner: owner,
      repo: repoName,
    });
  }

  /**
   * Get all the Contributors of the specified repository
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoContributors(
    owner: string,
    repoName: string,
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.listContributors({
      owner: owner,
      repo: repoName,
      per_page: 100,
      page: page,
    });
  }

  /**
   * Get all the programming languages used in a repository
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoLanguages(
    owner: string,
    repoName: string,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.listLanguages({
      owner: owner,
      repo: repoName,
    });
  }

  /**
   * Get the last years commit acitivity
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoCommitActivity(
    ownerName: string,
    repoName: string,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.getCommitActivityStats({
      owner: ownerName,
      repo: repoName,
    });
  }

  /**
   * Get all the repositories of a organisation
   * @param orgName The name of the organisation
   * @returns A promise of the type OcktokitResponse
   */
  async get_OrganisationRepositories(
    orgName: string,
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.listForOrg({
      org: orgName,
      per_page: 100,
      page: page,
    });
  }

  /**********************************Commits Calls**************************************************/

  /**
   * Get all the commits to the repo
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoCommits(
    owner: string,
    repoName: string,
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.listCommits({
      owner: owner,
      repo: repoName,
      per_page: 100,
      page: page,
    });
  }

  /**
   * Get all the comments for all the commits of a repo
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoCommitComments(
    owner: string,
    repoName: string,
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.repos.listCommitCommentsForRepo({
      owner: owner,
      repo: repoName,
      per_page: 100,
      page: page,
    });
  }

  /**
   * Get the difference between two commits
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @param parentOwner The name of the owner of the parent repository
   * @param parentDefaultBranch The name of the parent repository default branch
   * @param defaultBranch The name of this repository default branch
   * @returns A promise of the type OcktokitResponse
   */
  async compare_Commits(
    owner: string,
    repoName: string,
    parentOwner: string,
    parentDefaultBranch: string,
    defaultBranch: string,
  ): Promise<OctokitResponse<any>> {
    const basehead = `${defaultBranch}...${parentOwner}:${parentDefaultBranch}`;
    return this.octokit.rest.repos.compareCommitsWithBasehead({
      owner: owner,
      repo: repoName,
      basehead: basehead,
    });
  }

  /**********************************Pulls Calls**************************************************/

  /**
   * Get the pull requests of the repo, with its state
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @param state The state of the pull request. Must be open, closed or all.
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoPulls(
    owner: string,
    repoName: string,
    state: 'open' | 'closed' | 'all',
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.pulls.list({
      owner: owner,
      repo: repoName,
      state: state,
      per_page: 100,
      page: page,
    });
  }

  /**********************************Issues Calls**************************************************/

  /**
   * Get all the issues of a repo, with its state
   * @param owner The name of the owner of the repository
   * @param repoName The name of the repository
   * @param state The state of the issue. Must be open, closed or all.
   * @returns A promise of the type OcktokitResponse
   */
  async get_RepoIssues(
    owner: string,
    repoName: string,
    state: 'open' | 'closed' | 'all',
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.issues.listForRepo({
      owner: owner,
      repo: repoName,
      state: state,
      per_page: 100,
      page: page,
    });
  }

  /***************************************Organisation Calls**************************************************/

  /**
   * Get the data of the specified organisation
   * @param orgName The name of the organisation
   * @returns A promise of the type OcktokitResponse
   */
  async get_Organisation(orgName: string): Promise<OctokitResponse<any>> {
    return this.octokit.rest.orgs.get({
      org: orgName,
    });
  }

  /***************************************Member Calls**************************************************/

  /**
   * Get all the members of a organisation
   * @param orgName The name of the organisation
   * @returns A promise of the type OcktokitResponse
   */
  async get_OrganisationMembers(
    orgName: string,
    page: number,
  ): Promise<OctokitResponse<any>> {
    return this.octokit.rest.orgs.listMembers({
      org: orgName,
      per_page: 100,
      page: page,
    });
  }
}
