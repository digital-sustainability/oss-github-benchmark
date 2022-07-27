import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  ViewChild,
} from '@angular/core';
import { DataService } from 'src/app/data.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { lowerCase } from 'lodash-es';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

const sortState: Sort = { active: 'name', direction: 'desc' };

@Component({
  selector: 'app-explore-item',
  templateUrl: './explore-item.component.html',
  styleUrls: ['./explore-item.component.scss'],
})
export class ExploreItemComponent implements OnInit {
  item: any;
  displayedColumns: string[] = [
    'name',
    'organization',
    'num_commits',
    'num_contributors',
    'num_watchers',
    'fork',
    'num_stars',
    'num_forks',
    'created_at',
    'updated_at',
  ];
  dataSource: any = 0;
  institutionStats: object[] = [
    { text: 'Sector:', content: 'sector', toNiceName: true },
    { text: 'Repositories:', content: 'num_repos', toNiceName: false },
    { text: 'Members:', content: 'num_members', toNiceName: false },
    {
      text: 'Contributors:',
      content: 'total_num_contributors',
      toNiceName: false,
    },
    {
      text: 'Own repositories forks:',
      content: 'total_num_own_repo_forks',
      toNiceName: false,
    },
    {
      text: 'Forks in repositories:',
      content: 'total_num_forks_in_repos',
      toNiceName: false,
    },
    { text: 'Commits:', content: 'total_num_commits', toNiceName: false },
    {
      text: 'Pull requests:',
      content: 'total_pull_requests',
      toNiceName: false,
    },
    { text: 'Issues:', content: 'total_issues', toNiceName: false },
    { text: 'Stars:', content: 'total_num_stars', toNiceName: false },
    { text: 'Watchers:', content: 'total_num_watchers', toNiceName: false },
    {
      text: 'Commits last year:',
      content: 'total_commits_last_year',
      toNiceName: false,
    },
    {
      text: 'Total pull requests:',
      content: 'total_pull_requests_all',
      toNiceName: false,
    },
    {
      text: 'Total closed pull requests:',
      content: 'total_pull_requests_closed',
      toNiceName: false,
    },
    { text: 'Total issues:', content: 'total_issues_all', toNiceName: false },
    {
      text: 'Total closed issues:',
      content: 'total_issues_closed',
      toNiceName: false,
    },
    { text: 'Comments:', content: 'total_comments', toNiceName: false },
    { text: 'Organisations:', content: 'num_orgs', toNiceName: false },
  ];
  includeForks: boolean = false;
  recordFilter = '';
  page: number = 0;
  count: number = 30;
  activeSort: string = 'num_commits';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  numRepositories: number;

  resetPaginator() {
    this.paginator.pageIndex = 0;
    this.page = 0;
  }

  includeForksChange(checked: boolean) {
    this.includeForks = checked;
    this.resetPaginator();
    this.reloadData();
  }

  constructor(
    private dataService: DataService,
    private dialogRef: MatDialogRef<ExploreItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.reloadData();
  }

  reloadData() {
    this.dataService
      .loadRepoData({
        sort: this.activeSort,
        direction: this.sortDirection,
        page: this.page.toString(),
        count: this.count.toString(),
        includeForks: this.includeForks.toString(),
        search: `"institution":"${this.data.institution.shortname}"`,
      })
      .then((data) => {
        let repoData: any[] = data.jsonData;
        this.numRepositories = data.total;
        console.log(this.data);
        this.item = Object.assign({}, this.data.institution);
        this.item.repos = repoData;
        if (this.item.repos) {
          this.item.repos.forEach((repo) => {
            repo.name = lowerCase(repo.name);
          });
        }
        if (this.item.repos.length > 0) {
          this.dataSource = new MatTableDataSource(this.item.repos);
        }
      });
  }

  navigateTo(url: string): void {
    window.open(url, '_blank');
  }

  paginatorUpdate(event) {
    this.page = event.pageIndex;
    this.count = event.pageSize;
    this.reloadData();
  }

  sortingUpdate(event: Sort) {
    this.activeSort = event.active;
    this.sortDirection = event.direction == 'asc' ? 'ASC' : 'DESC';
    this.resetPaginator();
    this.reloadData();
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
}
