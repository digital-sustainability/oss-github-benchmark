import { OctokitResponse } from '@octokit/types';

/************************************Github Types*******************************************/
export interface GithubResponse {
  status: number;
  url: string;
  headers: any[];
  data: GithubUser;
}

export interface GithubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
}

export interface GithubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  archive_url: string;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  deployments_url: string;
  downloads_url: string;
  events_url: string;
  forks_url: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  languages_url: string;
  merges_url: string;
  milestones_url: string;
  notifications_url: string;
  pulls_url: string;
  releases_url: string;
  ssh_url: string;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  tags_url: string;
  teams_url: string;
  trees_url: string;
  clone_url: string;
  mirror_url: string;
  hooks_url: string;
  svn_url: string;
  homepage: string;
  language: null;
  forks_count: number;
  forks: number;
  stargazers_count: number;
  watchers_count: number;
  watchers: number;
  size: number;
  default_branch: string;
  open_issues_count: number;
  open_issues: number;
  is_template: boolean;
  topics: string[];
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  has_discussions: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: string;
  pushed_at: Date;
  created_at: Date;
  updated_at: Date;
  permissions: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
  allow_rebase_merge: boolean;
  template_repository: {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    private: boolean;
    html_url: string;
    description: string;
    fork: boolean;
    url: string;
    archive_url: string;
    assignees_url: string;
    blobs_url: string;
    branches_url: string;
    collaborators_url: string;
    comments_url: string;
    commits_url: string;
    compare_url: string;
    contents_url: string;
    contributors_url: string;
    deployments_url: string;
    downloads_url: string;
    events_url: string;
    forks_url: string;
    git_commits_url: string;
    git_refs_url: string;
    git_tags_url: string;
    git_url: string;
    issue_comment_url: string;
    issue_events_url: string;
    issues_url: string;
    keys_url: string;
    labels_url: string;
    languages_url: string;
    merges_url: string;
    milestones_url: string;
    notifications_url: string;
    pulls_url: string;
    releases_url: string;
    ssh_url: string;
    stargazers_url: string;
    statuses_url: string;
    subscribers_url: string;
    subscription_url: string;
    tags_url: string;
    teams_url: string;
    trees_url: string;
    clone_url: string;
    mirror_url: string;
    hooks_url: string;
    svn_url: string;
    homepage: string;
    language: null;
    forks: number;
    forks_count: number;
    stargazers_count: number;
    watchers_count: number;
    watchers: number;
    size: number;
    default_branch: string;
    open_issues: number;
    open_issues_count: number;
    is_template: boolean;
    license: {
      key: string;
      name: string;
      url: string;
      spdx_id: string;
      node_id: string;
      html_url: string;
    };
    topics: string[];
    has_issues: boolean;
    has_projects: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_downloads: boolean;
    archived: boolean;
    disabled: boolean;
    visibility: string;
    pushed_at: Date;
    created_at: Date;
    updated_at: Date;
    permissions: {
      admin: boolean;
      push: boolean;
      pull: boolean;
    };
    allow_rebase_merge: boolean;
    temp_clone_token: string;
    allow_squash_merge: boolean;
    allow_auto_merge: boolean;
    delete_branch_on_merge: boolean;
    allow_merge_commit: boolean;
    subscribers_count: number;
    network_count: number;
  };
  temp_clone_token: string;
  allow_squash_merge: boolean;
  allow_auto_merge: boolean;
  delete_branch_on_merge: boolean;
  allow_merge_commit: boolean;
  subscribers_count: number;
  network_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  };
  organization: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  parent: {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    private: boolean;
    html_url: string;
    description: string;
    fork: boolean;
    url: string;
    archive_url: string;
    assignees_url: string;
    blobs_url: string;
    branches_url: string;
    collaborators_url: string;
    comments_url: string;
    commits_url: string;
    compare_url: string;
    contents_url: string;
    contributors_url: string;
    deployments_url: string;
    downloads_url: string;
    events_url: string;
    forks_url: string;
    git_commits_url: string;
    git_refs_url: string;
    git_tags_url: string;
    git_url: string;
    issue_comment_url: string;
    issue_events_url: string;
    issues_url: string;
    keys_url: string;
    labels_url: string;
    languages_url: string;
    merges_url: string;
    milestones_url: string;
    notifications_url: string;
    pulls_url: string;
    releases_url: string;
    ssh_url: string;
    stargazers_url: string;
    statuses_url: string;
    subscribers_url: string;
    subscription_url: string;
    tags_url: string;
    teams_url: string;
    trees_url: string;
    clone_url: string;
    mirror_url: string;
    hooks_url: string;
    svn_url: string;
    homepage: string;
    language: null;
    forks_count: number;
    stargazers_count: number;
    watchers_count: number;
    size: number;
    default_branch: string;
    open_issues_count: number;
    is_template: boolean;
    topics: string[];
    has_issues: boolean;
    has_projects: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_downloads: boolean;
    archived: boolean;
    disabled: boolean;
    visibility: string;
    pushed_at: Date;
    created_at: Date;
    updated_at: Date;
    permissions: {
      admin: boolean;
      push: boolean;
      pull: boolean;
    };
    allow_rebase_merge: boolean;
    temp_clone_token: string;
    allow_squash_merge: boolean;
    allow_auto_merge: boolean;
    delete_branch_on_merge: boolean;
    allow_merge_commit: boolean;
    subscribers_count: number;
    network_count: number;
    license: {
      key: string;
      name: string;
      url: string;
      spdx_id: string;
      node_id: string;
      html_url: string;
    };
    forks: number;
    open_issues: number;
    watchers: number;
  };
  source: {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    private: boolean;
    html_url: string;
    description: string;
    fork: boolean;
    url: string;
    archive_url: string;
    assignees_url: string;
    blobs_url: string;
    branches_url: string;
    collaborators_url: string;
    comments_url: string;
    commits_url: string;
    compare_url: string;
    contents_url: string;
    contributors_url: string;
    deployments_url: string;
    downloads_url: string;
    events_url: string;
    forks_url: string;
    git_commits_url: string;
    git_refs_url: string;
    git_tags_url: string;
    git_url: string;
    issue_comment_url: string;
    issue_events_url: string;
    issues_url: string;
    keys_url: string;
    labels_url: string;
    languages_url: string;
    merges_url: string;
    milestones_url: string;
    notifications_url: string;
    pulls_url: string;
    releases_url: string;
    ssh_url: string;
    stargazers_url: string;
    statuses_url: string;
    subscribers_url: string;
    subscription_url: string;
    tags_url: string;
    teams_url: string;
    trees_url: string;
    clone_url: string;
    mirror_url: string;
    hooks_url: string;
    svn_url: string;
    homepage: string;
    language: null;
    forks_count: number;
    stargazers_count: number;
    watchers_count: number;
    size: number;
    default_branch: string;
    open_issues_count: number;
    is_template: boolean;
    topics: string[];
    has_issues: boolean;
    has_projects: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_downloads: boolean;
    archived: boolean;
    disabled: boolean;
    visibility: string;
    pushed_at: Date;
    created_at: Date;
    updated_at: Date;
    permissions: {
      admin: boolean;
      push: boolean;
      pull: boolean;
    };
    allow_rebase_merge: boolean;
    temp_clone_token: string;
    allow_squash_merge: boolean;
    allow_auto_merge: boolean;
    delete_branch_on_merge: boolean;
    allow_merge_commit: boolean;
    subscribers_count: number;
    network_count: number;
    license: {
      key: string;
      name: string;
      url: string;
      spdx_id: string;
      node_id: string;
      html_url: string;
    };
    forks: number;
    open_issues: number;
    watchers: number;
    security_and_analysis: {
      advanced_security: {
        status: string;
      };
      secret_scanning: {
        status: string;
      };
      secret_scanning_push_protection: {
        status: string;
      };
    };
  };
}

export interface GithubContributor {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  contributions: number;
}

export interface GithubCommit {
  url: string;
  sha: string;
  node_id: string;
  html_url: string;
  comments_url: string;
  commit: {
    url: string;
    author: {
      name: string;
      email: string;
      date: Date;
    };
    committer: {
      name: string;
      email: string;
      date: Date;
    };
    message: string;
    tree: {
      url: string;
      sha: string;
    };
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: string | null;
      payload: string | null;
    };
  };
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  committer: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  parents: [
    {
      url: string;
      sha: string;
    },
  ];
}

export interface GitHubPull {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  number: number;
  state: string;
  locked: true;
  title: string;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  body: string;
  labels: [
    {
      id: number;
      node_id: string;
      url: string;
      name: string;
      description: string;
      color: string;
      default: true;
    },
  ];
  milestone: {
    url: string;
    html_url: string;
    labels_url: string;
    id: number;
    node_id: string;
    number: number;
    state: string;
    title: string;
    description: string;
    creator: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    open_issues: number;
    closed_issues: number;
    created_at: Date;
    updated_at: Date;
    closed_at: Date;
    due_on: Date;
  };
  active_lock_reason: string;
  created_at: Date;
  updated_at: Date;
  closed_at: Date;
  merged_at: Date;
  merge_commit_sha: string;
  assignee: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  assignees: [
    {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    },
    {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: true;
    },
  ];
  requested_reviewers: [
    {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    },
  ];
  requested_teams: [
    {
      id: number;
      node_id: string;
      url: string;
      html_url: string;
      name: string;
      slug: string;
      description: string;
      privacy: string;
      permission: string;
      members_url: string;
      repositories_url: string;
      parent: null;
    },
  ];
  head: {
    label: string;
    ref: string;
    sha: string;
    user: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    repo: {
      id: number;
      node_id: string;
      name: string;
      full_name: string;
      owner: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
      };
      private: boolean;
      html_url: string;
      description: string;
      fork: boolean;
      url: string;
      archive_url: string;
      assignees_url: string;
      blobs_url: string;
      branches_url: string;
      collaborators_url: string;
      comments_url: string;
      commits_url: string;
      compare_url: string;
      contents_url: string;
      contributors_url: string;
      deployments_url: string;
      downloads_url: string;
      events_url: string;
      forks_url: string;
      git_commits_url: string;
      git_refs_url: string;
      git_tags_url: string;
      git_url: string;
      issue_comment_url: string;
      issue_events_url: string;
      issues_url: string;
      keys_url: string;
      labels_url: string;
      languages_url: string;
      merges_url: string;
      milestones_url: string;
      notifications_url: string;
      pulls_url: string;
      releases_url: string;
      ssh_url: string;
      stargazers_url: string;
      statuses_url: string;
      subscribers_url: string;
      subscription_url: string;
      tags_url: string;
      teams_url: string;
      trees_url: string;
      clone_url: string;
      mirror_url: string;
      hooks_url: string;
      svn_url: string;
      homepage: string;
      language: null;
      forks_count: number;
      stargazers_count: number;
      watchers_count: number;
      size: number;
      default_branch: string;
      open_issues_count: number;
      is_template: true;
      topics: string[];
      has_issues: true;
      has_projects: true;
      has_wiki: true;
      has_pages: boolean;
      has_downloads: true;
      archived: boolean;
      disabled: boolean;
      visibility: string;
      pushed_at: Date;
      created_at: Date;
      updated_at: Date;
      permissions: {
        admin: boolean;
        push: boolean;
        pull: true;
      };
      allow_rebase_merge: true;
      template_repository: null;
      temp_clone_token: string;
      allow_squash_merge: true;
      allow_auto_merge: boolean;
      delete_branch_on_merge: true;
      allow_merge_commit: true;
      subscribers_count: number;
      network_count: number;
      license: {
        key: string;
        name: string;
        url: string;
        spdx_id: string;
        node_id: string;
        html_url: string;
      };
      forks: number;
      open_issues: number;
      watchers: number;
    };
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    repo: {
      id: number;
      node_id: string;
      name: string;
      full_name: string;
      owner: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
      };
      private: boolean;
      html_url: string;
      description: string;
      fork: boolean;
      url: string;
      archive_url: string;
      assignees_url: string;
      blobs_url: string;
      branches_url: string;
      collaborators_url: string;
      comments_url: string;
      commits_url: string;
      compare_url: string;
      contents_url: string;
      contributors_url: string;
      deployments_url: string;
      downloads_url: string;
      events_url: string;
      forks_url: string;
      git_commits_url: string;
      git_refs_url: string;
      git_tags_url: string;
      git_url: string;
      issue_comment_url: string;
      issue_events_url: string;
      issues_url: string;
      keys_url: string;
      labels_url: string;
      languages_url: string;
      merges_url: string;
      milestones_url: string;
      notifications_url: string;
      pulls_url: string;
      releases_url: string;
      ssh_url: string;
      stargazers_url: string;
      statuses_url: string;
      subscribers_url: string;
      subscription_url: string;
      tags_url: string;
      teams_url: string;
      trees_url: string;
      clone_url: string;
      mirror_url: string;
      hooks_url: string;
      svn_url: string;
      homepage: string;
      language: null;
      forks_count: number;
      stargazers_count: number;
      watchers_count: number;
      size: number;
      default_branch: string;
      open_issues_count: number;
      is_template: true;
      topics: string[];
      has_issues: true;
      has_projects: true;
      has_wiki: true;
      has_pages: boolean;
      has_downloads: true;
      archived: boolean;
      disabled: boolean;
      visibility: string;
      pushed_at: Date;
      created_at: Date;
      updated_at: Date;
      permissions: {
        admin: boolean;
        push: boolean;
        pull: true;
      };
      allow_rebase_merge: true;
      template_repository: null;
      temp_clone_token: string;
      allow_squash_merge: true;
      allow_auto_merge: boolean;
      delete_branch_on_merge: true;
      allow_merge_commit: true;
      subscribers_count: number;
      network_count: number;
      license: {
        key: string;
        name: string;
        url: string;
        spdx_id: string;
        node_id: string;
        html_url: string;
      };
      forks: number;
      open_issues: number;
      watchers: number;
    };
  };
  _links: {
    self: {
      href: string;
    };
    html: {
      href: string;
    };
    issue: {
      href: string;
    };
    comments: {
      href: string;
    };
    review_comments: {
      href: string;
    };
    review_comment: {
      href: string;
    };
    commits: {
      href: string;
    };
    statuses: {
      href: string;
    };
  };
  author_association: string;
  auto_merge: null;
  draft: boolean;
}

export interface GitHubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: string;
  title: string;
  body: string;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  labels: [
    {
      id: number;
      node_id: string;
      url: string;
      name: string;
      description: string;
      color: string;
      default: true;
    },
  ];
  assignee: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  assignees: [
    {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    },
  ];
  milestone: {
    url: string;
    html_url: string;
    labels_url: string;
    id: number;
    node_id: string;
    number: number;
    state: string;
    title: string;
    description: string;
    creator: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    open_issues: number;
    closed_issues: number;
    created_at: Date;
    updated_at: Date;
    closed_at: Date;
    due_on: Date;
  };
  locked: true;
  active_lock_reason: string;
  comments: number;
  pull_request: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
  closed_at: Date;
  created_at: Date;
  updated_at: Date;
  closed_by: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  author_association: string;
  state_reason: string;
}

export interface GitHubCommitComment {
  html_url: string;
  url: string;
  id: number;
  node_id: string;
  body: string;
  path: string;
  position: number;
  line: number;
  commit_id: string;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  created_at: Date;
  updated_at: Date;
  author_association: string;
}

export interface GithubCommitActivity {
  days: number[];
  total: number;
  week: number;
}

export interface GithubCommitComparison {
  url: string;
  html_url: string;
  permalink_url: string;
  diff_url: string;
  patch_url: string;
  base_commit: {
    url: string;
    sha: string;
    node_id: string;
    html_url: string;
    comments_url: string;
    commit: {
      url: string;
      author: {
        name: string;
        email: string;
        date: Date;
      };
      committer: {
        name: string;
        email: string;
        date: Date;
      };
      message: string;
      tree: {
        url: string;
        sha: string;
      };
      comment_count: number;
      verification: {
        verified: boolean;
        reason: string;
        signature: null;
        payload: null;
      };
    };
    author: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    committer: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    parents: [
      {
        url: string;
        sha: string;
      },
    ];
  };
  merge_base_commit: {
    url: string;
    sha: string;
    node_id: string;
    html_url: string;
    comments_url: string;
    commit: {
      url: string;
      author: {
        name: string;
        email: string;
        date: Date;
      };
      committer: {
        name: string;
        email: string;
        date: Date;
      };
      message: string;
      tree: {
        url: string;
        sha: string;
      };
      comment_count: number;
      verification: {
        verified: boolean;
        reason: string;
        signature: null;
        payload: null;
      };
    };
    author: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    committer: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    parents: [
      {
        url: string;
        sha: string;
      },
    ];
  };
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: [
    {
      url: string;
      sha: string;
      node_id: string;
      html_url: string;
      comments_url: string;
      commit: {
        url: string;
        author: {
          name: string;
          email: string;
          date: Date;
        };
        committer: {
          name: string;
          email: string;
          date: Date;
        };
        message: string;
        tree: {
          url: string;
          sha: string;
        };
        comment_count: number;
        verification: {
          verified: boolean;
          reason: string;
          signature: null;
          payload: null;
        };
      };
      author: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
      };
      committer: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
      };
      parents: [
        {
          url: string;
          sha: string;
        },
      ];
    },
  ];
  files: [
    {
      sha: string;
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
      blob_url: string;
      raw_url: string;
      contents_url: string;
      patch: string;
    },
  ];
}

export interface GithubOrganisation {
  login: string;
  id: number;
  node_id: string;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  twitter_username: string;
  is_verified: true;
  has_organization_projects: true;
  has_repository_projects: true;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: Date;
  updated_at: Date;
  type: string;
  total_private_repos: number;
  owned_private_repos: number;
  private_gists: number;
  disk_usage: number;
  collaborators: number;
  billing_email: string;
  plan: {
    name: string;
    space: number;
    private_repos: number;
    filled_seats: number;
    seats: number;
  };
  default_repository_permission: string;
  members_can_create_repositories: true;
  two_factor_requirement_enabled: true;
  members_allowed_repository_creation_type: string;
  members_can_create_public_repositories: boolean;
  members_can_create_private_repositories: boolean;
  members_can_create_internal_repositories: boolean;
  members_can_create_pages: true;
  members_can_fork_private_repositories: boolean;
}

export interface GithubOrganisationRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  archive_url: string;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  deployments_url: string;
  downloads_url: string;
  events_url: string;
  forks_url: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  languages_url: string;
  merges_url: string;
  milestones_url: string;
  notifications_url: string;
  pulls_url: string;
  releases_url: string;
  ssh_url: string;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  tags_url: string;
  teams_url: string;
  trees_url: string;
  clone_url: string;
  mirror_url: string;
  hooks_url: string;
  svn_url: string;
  homepage: string;
  language: null;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  open_issues_count: number;
  is_template: boolean;
  topics: [string, string, string, string];
  has_issues: true;
  has_projects: true;
  has_wiki: true;
  has_pages: boolean;
  has_downloads: true;
  has_discussions: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: string;
  pushed_at: Date;
  created_at: Date;
  updated_at: Date;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: true;
  };
  security_and_analysis: {
    advanced_security: {
      status: string;
    };
    secret_scanning: {
      status: string;
    };
    secret_scanning_push_protection: {
      status: string;
    };
  };
}

export interface GithubOrganisationMember {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

/************************************Database Types*******************************************/

export interface RawResponse {
  method: string;
  ts: Date;
  institutionName: string;
  orgName?: string;
  repoName?: string;
  userName?: string;
  response: OctokitResponse<any>;
}

export interface TodoInstitution {
  uuid: string;
  sector: string;
  ts: Date;
  shortname: string;
  name_de: string;
  orgs: TodoOrganisation[];
}

export interface TodoOrganisation {
  name: string;
  ts: Date;
}

export interface UserQueryConfig {
  search?: string;
  sort: string;
  direction: 'ASC' | 'DESC';
  page: number;
  count: number;
}

/************************************Code Types*******************************************/
export interface RepositoryInfo {
  id: number;
  uuid: string;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: Date;
  updated_at: Date;
  pushed_at: Date;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  };
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  permissions: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface Organization {
  num_repos: number;
  num_members: number;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
  total_num_forks_in_repos: number;
  total_num_commits: number;
  total_pull_requests: number;
  total_issues: number;
  total_num_stars: number;
  total_num_watchers: number;
  total_pull_requests_all: number;
  total_pull_requests_closed: number;
  total_issues_all: number;
  total_issues_closed: number;
  total_comments: number;
  name: string;
  url: string;
  description: string;
  avatar: string;
  created_at: Date;
  location: string;
  email: string;
  repos: string[];
  repo_names: string[];
  total_licenses: Licenses;
}

export interface Languages {
  [key: string]: number;
}

export interface User {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  blog: string;
  company: string;
  email: string | null;
  twitter_username: string | null;
  location: string;
  created_at: Date;
  updated_at: Date;
  contributions: Contributions;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  orgs: string[];
}

export interface Contributions {
  [key: string]: OrganisationContributions;
}

export interface OrganisationContributions {
  [key: string]: RepositoryContributions;
}

export interface RepositoryContributions {
  [key: string]: number;
}

export interface Licenses {
  [key: string]: number;
}

export interface Repository {
  name: string;
  uuid: string;
  url: string;
  institution: string;
  organization: string;
  description: string;
  fork: boolean;
  archived: boolean;
  num_forks: number;
  num_contributors: number;
  num_commits: number;
  num_stars: number;
  num_watchers: number;
  commit_activities: GithubCommitActivity[];
  has_own_commits: number;
  issues_closed: number;
  issues_all: number;
  pull_requests_closed: number;
  pull_requests_all: number;
  comments: number;
  languages: Languages;
  timestamp: Date;
  createdTimestamp: Date;
  updatedTimestamp: Date;
  contributors: string[];
  coders: string[];
  license: string;
  logo?: string;
}

export interface TodoIndustry {
  name_de: string;
  institutions: TodoInstitution[];
}

export interface Industry {
  name: string;
  institutions: TodoIndustry;
}

export interface Institution {
  uuid: string;
  shortname: string;
  name_de: string;
  num_repos: number;
  num_members: number;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
  total_num_forks_in_repos: number;
  total_num_commits: number;
  total_pull_requests: number;
  total_issues: number;
  total_num_stars: number;
  total_num_watchers: number;
  total_pull_requests_all: number;
  total_pull_requests_closed: number;
  total_issues_all: number;
  total_issues_closed: number;
  total_comments: number;
  org_names: string[];
  orgs: Organization[];
  num_orgs: number;
  avatar: string[];
  repos: string[];
  repo_names: string[];
  total_licenses: Licenses;
  timestamp: Date;
  sector: string;
  stats?: Statistic[];
  searchString?: string;
}

export interface Statistic {
  timestamp: Date;
  num_repos: number;
  num_members: number;
  total_num_contributors: number;
  total_num_own_repo_forks: number;
  total_num_forks_in_repos: number;
  total_num_commits: number;
  total_pull_requests: number;
  total_issues: number;
  total_num_stars: number;
  total_num_watchers: number;
  total_commits_last_year: number;
  total_pull_requests_all: number;
  total_pull_requests_closed: number;
  total_issues_all: number;
  total_issues_closed: number;
  total_comments: number;
}

/************************************Old Types*******************************************/

export interface Commit {
  url: string;
  sha: string;
  node_id: string;
  html_url: string;
  comments_url: string;
  commit: object;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  committer: object;
  parents: object;
}

export interface RepositoryNew {
  name: string;
  uuid: string;
  url: string;
  institution: string;
  organization: string;
  description: string;
  fork: boolean;
  archived: boolean;
  num_forks: number;
  num_contributors: number;
  num_commits: number;
  num_stars: number;
  num_watchers: number;
  commit_activities: number;
  has_own_commits: number;
  issues_closed: number;
  issues_all: number;
  pull_requests_closed: number;
  pull_requests_all: number;
  comments: number;
  languages: Languages;
  timestamp: Date;
  createdTimestamp: Date;
  updatedTimestamp: Date;
  contributors: string[];
  coders: string[];
  license: string;
  logo?: string;
}

export interface Status {
  currentSectorNO: number;
  currentInstitutionNO: number;
  currentInstitutionName: string;
  running: boolean;
  progress: number;
  lastUpdated: Date;
}

export interface Progress {
  currentSector: number;
  currentInstitution: number;
}

export interface InstitutionQueryConfig {
  sector: string[];
  search?: string;
  sort: string;
  direction: 'ASC' | 'DESC';
  page: number;
  count: number;
  sendStats: boolean;
  includeForksInSort: boolean;
  findName: string;
}

export interface RepositoryQueryConfig {
  search?: string;
  sort: string;
  direction: 'ASC' | 'DESC';
  page: number;
  count: number;
  includeForks: boolean;
}
