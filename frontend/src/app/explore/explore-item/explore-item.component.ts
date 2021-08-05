import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  ViewChild,
} from '@angular/core';
import { IInstitution } from 'src/app/interfaces/institution';
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
export class ExploreItemComponent implements OnInit, AfterViewInit {
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
    { text: 'UUID:', content: 'uuid', toNiceName: false },
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
    { text: 'Last updated:', content: 'timestamp', toNiceName: false },
  ];
  includeForks: boolean;
  recordFilter = '';

  triggerFilter() {
    this.dataSource.filter = 'trigger filter';
  }

  includeForksChange(checked: boolean) {
    this.includeForks = checked;
    if (checked) {
      this.item.num_repos += this.item.total_num_forks_in_repos;
    } else {
      this.item.num_repos -= this.item.total_num_forks_in_repos;
    }
    this.triggerFilter();
  }

  constructor(
    private dialogRef: MatDialogRef<ExploreItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.sort = new MatSort();
  }

  ngOnInit(): void {
    this.item = Object.assign({}, this.data.institution);
    this.includeForks = this.data.includeForks;
    if (this.item.repos) {
      this.item.repos.forEach((repo) => {
        repo.name = lowerCase(repo.name);
      });
    }
    if (this.item.repos.length > 0) {
      this.dataSource = new MatTableDataSource(this.item.repos);
    }
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    console.log(this.dataSource);
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let datastring: string = '';
      let property: string;
      let filterNew = this.recordFilter;
      for (property in data) {
        datastring += data[property];
      }
      datastring = datastring.replace(/\s/g, '').toLowerCase();
      filterNew = filterNew.replace(/\s/g, '').toLowerCase();
      return (
        datastring.includes(filterNew) && (this.includeForks || !data.fork)
      );
    };
    this.triggerFilter();
  }

  navigateTo(url: string): void {
    window.open(url, '_blank');
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}
