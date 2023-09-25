import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { lowerCase } from 'lodash-es';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChartConfiguration, ChartType } from 'chart.js';
import Chart from 'chart.js/auto';
import { Institution } from '../types';
@Component({
  selector: 'app-institution-detail-view',
  templateUrl: './institution-detail-view.component.html',
  styleUrls: ['./institution-detail-view.component.scss'],
})
export class InstitutionDetailViewComponent implements OnInit {
  public lineChartData: ChartConfiguration['data'];

  public lineChartOptions = {
    elements: {
      point: {
        radius: 5,
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          callback: function (value: Date) {
            return new Date(value).toLocaleDateString();
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            return new Date(context[0].raw.x).toLocaleDateString();
          },
        },
      },
    },
  };

  public chartType: ChartType = 'line';

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
    /*{
      text: 'Own repositories forks:',
      content: 'total_num_own_repo_forks',
      toNiceName: false,
    },*/
    {
      text: 'Forks in repositories:',
      content: 'total_num_forks_in_repos',
      toNiceName: false,
    },
    { text: 'Commits:', content: 'total_num_commits', toNiceName: false },
    { text: 'Stars:', content: 'total_num_stars', toNiceName: false },
    { text: 'Watchers:', content: 'total_num_watchers', toNiceName: false },
    {
      text: 'Commits last year:',
      content: 'total_commits_last_year',
      toNiceName: false,
    },
    {
      text: 'Total pull requests:',
      content: 'total_pull_requests',
      toNiceName: false,
    },
    {
      text: 'Total closed pull requests:',
      content: 'total_pull_requests_closed',
      toNiceName: false,
    },
    { text: 'Total issues:', content: 'total_issues', toNiceName: false },
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
    private dialogRef: MatDialogRef<InstitutionDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      institution: Institution;
      includeForks: boolean;
    },
  ) {
    const charts: string[] = [
      'Repositories',
      'Members',
      'Comments',
      'Issues',
      'Closed issues',
      'Commits',
      'Contributors',
      'Forks in repositories',
      'Own repositories forks',
      'Stars',
      'Watchers',
      'Pull requests',
      'Closed pull requests',
    ];
    this.lineChartData = {
      datasets: charts.map((str) => {
        return {
          label: str,
          data: [],
          backgroundColor: 'black',
          borderColor: 'black',
          pointBackgroundColor: 'gray',
          pointHoverBorderColor: 'black',
          pointBorderColor: 'black',
          hoverRadius: 10,
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
        };
      }),
    };
  }

  ngOnInit(): void {
    Chart.register({
      id: 'corsair',
      afterInit: (chart) => {
        // @ts-ignore
        chart.corsair = {
          x: 0,
          y: 0,
        };
      },
      afterEvent: (chart, evt) => {
        const {
          chartArea: { top, bottom, left, right },
        } = chart;
        const {
          event: { x, y },
        } = evt;
        if (x < left || x > right || y < top || y > bottom) {
          // @ts-ignore
          chart.corsair = {
            x,
            y,
            draw: false,
          };
          chart.draw();
          return;
        }

        // @ts-ignore
        chart.corsair = {
          x,
          y,
          draw: true,
        };

        chart.draw();
      },
      afterDatasetsDraw: (chart, _, opts) => {
        const {
          ctx,
          chartArea: { top, bottom, left, right },
        } = chart;
        // @ts-ignore
        const { x, y, draw } = chart.corsair;

        if (!draw) {
          return;
        }

        // @ts-ignore
        ctx.lineWidth = opts.width || 0;
        // @ts-ignore
        ctx.setLineDash(opts.dash || []);
        // @ts-ignore
        ctx.strokeStyle = opts.color || 'lightgray';

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, bottom);
        ctx.lineTo(x, top);
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.restore();
      },
    });
    /*this.data.institution.stats.forEach((stat) => {
      [
        'num_repos',
        'num_members',
        'total_comments',
        'total_issues_all',
        'total_issues_closed',
        'total_num_commits',
        'total_num_contributors',
        'total_num_forks_in_repos',
        'total_num_own_repo_forks',
        'total_num_stars',
        'total_num_watchers',
        'total_pull_requests_all',
        'total_pull_requests_closed',
      ].forEach((prop: string, index) => {
        this.lineChartData.datasets[index].data.push({
          x: new Date(stat.timestamp).getTime(),
          y: stat[prop],
        });
      });
    });*/
    this.reloadData();
  }

  reloadData() {
    this.dataService
      .loadRepoDataDetailView({
        sort: this.activeSort,
        direction: this.sortDirection,
        page: this.page.toString(),
        count: this.count.toString(),
        includeForks: this.includeForks.toString(),
        search: this.data.institution.shortname,
      })
      .then((data) => {
        let repoData: any[] = data.repositories;
        this.numRepositories = data.total;
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
