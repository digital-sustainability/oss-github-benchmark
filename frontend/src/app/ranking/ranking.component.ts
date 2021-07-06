import { Component, OnInit, Input } from '@angular/core';
import { DataService, IData } from 'src/app/data.service';

export interface Org {
  avatar: string,
  name: string,
  num_members: string,
  num_repos: string,
  org_names: string[],
  repo_names: string[],
  sector: string,
  total_comments: string,
  total_commits_last_year: string,
  total_issues_all: string,
  total_issues_closed: string,
  total_num_commits: string,
  total_num_contributors: string,
  total_num_forks_in_repos: string,
  total_num_own_repo_forks: string,
  total_num_stars: string,
  total_num_watchers: string,
  total_pull_requests_all: string,
  total_pull_requests_closed: string
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit {
  displayedColumns: string[] = ['name', 'num_members', 'num_repos', 'sector'];
  @Input() data: IData;
  organisations: Org[] = []
  
  constructor(private dataService: DataService) {
  };

  ngOnInit(): void {
    this.dataService.loadData().then( data => {  this.organisations = []
      = data.csvData});
  }
}