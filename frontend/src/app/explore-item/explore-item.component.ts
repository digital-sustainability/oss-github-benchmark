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
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-explore-item',
  templateUrl: './explore-item.component.html',
  styleUrls: ['./explore-item.component.scss'],
})
export class ExploreItemComponent implements OnInit {
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: 'Series A',
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',
      },
      {
        data: [28, 48, 40, 19, 86, 27, 90],
        label: 'Series B',
        backgroundColor: 'rgba(77,83,96,0.2)',
        borderColor: 'rgba(77,83,96,1)',
        pointBackgroundColor: 'rgba(77,83,96,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(77,83,96,1)',
        fill: 'origin',
      },
      {
        data: [180, 480, 770, 90, 1000, 270, 400],
        label: 'Series C',
        yAxisID: 'y-axis-1',
        backgroundColor: 'rgba(255,0,0,0.3)',
        borderColor: 'red',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',
      },
    ],
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.5,
      },
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {},
      'y-axis-0': {
        position: 'left',
      },
      'y-axis-1': {
        position: 'right',
        grid: {
          color: 'rgba(255,0,0,0.3)',
        },
        ticks: {
          color: 'red',
        },
      },
    },

    plugins: {
      legend: { display: true },
      annotation: {
        annotations: [
          {
            type: 'line',
            scaleID: 'x',
            value: 'March',
            borderColor: 'orange',
            borderWidth: 2,
            label: {
              position: 'center',
              enabled: true,
              color: 'orange',
              content: 'LineAnno',
              font: {
                weight: 'bold',
              },
            },
          },
        ],
      },
    },
  };

  public lineChartType: ChartType = 'line';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

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
