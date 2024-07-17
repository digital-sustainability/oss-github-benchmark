import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService } from 'src/app/data.service';
import { MatTableDataSource } from '@angular/material/table';
import { Institution } from 'src/app/types';
import { MatDialog } from '@angular/material/dialog';
import { RepositoryDetailViewComponent } from '../repository-detail-view/repository-detail-view.component';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { DataExportService } from '../services/data-export.service';
import { AuthenticationService } from '../authentication.service';
@Component({
  selector: 'app-repositories-ranking',
  templateUrl: './repositories-ranking.component.html',
  styleUrls: ['./repositories-ranking.component.scss'],
})
export class RepositoriesRankingComponent implements OnInit {
  item: Institution;
  displayedColumns: any[] = [
    ['name', 'Name', false, 'string'],
    ['logo', '', false, 'img'],
    ['institution', 'Institution', false, 'string'],
    ['organization', 'GitHub Organization', false, 'string'],
    // ['last_years_commits', 'Commits last year', false, 'number'],
    ['comments', 'Comments', false, 'number'],
    ['issues_all', 'Issues', false, 'number'],
    ['pull_requests_all', 'Pull requests', false, 'number'],
    ['num_commits', 'Commits', false, 'number'],
    ['num_contributors', 'Contributors', false, 'number'],
    ['num_forks', 'Forks', false, 'number'],
    ['num_stars', 'Stars', false, 'number'],
    ['has_own_commits', 'Own commits', false, 'number'],
    ['created_at', 'Created at', false, 'date'],
    ['updated_at', 'Updated at ', false, 'date'],
    ['fork', 'Is fork?', true, 'string'],
    ['license', 'License', false, 'string'],
  ];
  displayedColumnsOnlyNames = this.displayedColumns.map((column) => column[0]);
  recordFilter = '';
  searchTermRaw = '';
  dataSource: any = new MatTableDataSource();
  numRepositories: number;
  state: Date;
  repositories: any[] = [];
  includeForks: boolean = false;
  page: number = 0;
  count: number = 30;
  activeSort: string = 'num_commits';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  exportService: DataExportService = new DataExportService();
  

  resetPaginator() {
    this.paginator.pageIndex = 0;
    this.page = 0;
  }

  doFilter = (value: string) => {
    this.recordFilter = value.trim().toLocaleLowerCase();
    this.resetPaginator();
    this.reloadData();
  };

  includeForksChange(checked: boolean) {
    this.includeForks = checked;
    this.resetPaginator();
    this.reloadData();
  }

  goToLink(url: string) {
    window.open(url, '_blank');
  }

  constructor(
    private dataService: DataService,
    public dialog: MatDialog,
    private location: Location,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
  ) {}

  reloadData() {
    this.dataService
      .loadRepoData({
        search: this.recordFilter,
        sort: this.activeSort,
        direction: this.sortDirection,
        page: this.page.toString(),
        count: this.count.toString(),
        includeForks: this.includeForks.toString(),
      })
      .then((repoData) => {
        this.repositories = repoData.repositories;
        this.dataSource = new MatTableDataSource(repoData.repositories);
        this.numRepositories = repoData.total;
        this.route.paramMap.subscribe((map) => {
          const repositoryName = map.get('repository');
          const organisation = map.get('institution');
          if (repositoryName && organisation) {
            let repository = this.repositories.find((repo) => {
              return (
                repo.organization == organisation && repo.name == repositoryName
              );
            });
            this.openDialog(repository.uuid);
          }
        });
      });
  }

  ngOnInit(): void {
    this.reloadData();
  }

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }

  openDialog(uuid: string) {
    if (uuid) {
      let repository = this.repositories.find((repo) => {
        return repo.uuid == uuid;
      });
      this.changeURL(
        '/repositories/' + repository.organization + '/' + repository.name,
      );
      const dialogRef = this.dialog.open(RepositoryDetailViewComponent, {
        data: repository,
        autoFocus: false,
      });

      dialogRef.afterClosed().subscribe(() => {
        this.changeURL('/repositories');
      });
    }
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

  isLoggedIn(): boolean {
    return this.authService.isUserLoggedIn();
  }

  // trigger export of current view
  downloadData(){
    this.dataService
      .loadRepoData({
        sort: this.activeSort,
        direction: this.sortDirection,
        page: "0",
        count: "10000000",
        includeForks: this.includeForks.toString(),
      })
      .then((repoData) => {
        this.repositories = repoData.repositories;    
        this.exportService.exportData(this.repositories, 'repositories');
      }
    )

  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
}
