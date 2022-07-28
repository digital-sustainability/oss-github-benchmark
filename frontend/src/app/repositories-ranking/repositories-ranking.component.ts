import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { MatTableDataSource } from '@angular/material/table';
import { IInstitution } from 'src/app/interfaces/institution';
import { MatDialog } from '@angular/material/dialog';
import { RepositoryDetailViewComponent } from '../repository-detail-view/repository-detail-view.component';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-repositories-ranking',
  templateUrl: './repositories-ranking.component.html',
  styleUrls: ['./repositories-ranking.component.scss'],
})
export class RepositoriesRankingComponent implements OnInit {
  item: IInstitution;
  displayedColumns: any[] = [
    ['name', 'Name', false, 'string'],
    ['logo', '', false, 'img'],
    ['institution_name_de', 'Institution', false, 'string'],
    ['organisation_name_de', 'GitHub Organization', false, 'string'],
    // ['last_years_commits', 'Commits last year', false, 'number'],
    ['comments', 'Comments', false, 'number'],
    ['issues_all', 'Issues', false, 'number'],
    ['pull_requests_all', 'Pull requests', false, 'number'],
    ['num_commits', 'Commits', false, 'number'],
    ['num_contributors', 'Contributors', false, 'number'],
    ['num_forks', 'Forks', false, 'number'],
    ['num_stars', 'Stars', false, 'number'],
    ['has_own_commits', 'Own commits', false, 'number'],
    ['createdTimestamp', 'Created at', false, 'date'],
    ['updatedTimestamp', 'Updated at ', false, 'date'],
    ['fork', 'Is fork?', true, 'string'],
    ['license', 'License', false, 'string'],
  ];
  displayedColumnsOnlyNames = this.displayedColumns.map((column) => column[0]);
  recordFilter = '';
  @Input() data: IData;
  dataSource: any = new MatTableDataSource();
  numRepositories: number;
  state: Date;
  repositories: any[] = [];
  includeForks: boolean = false;
  page: number = 0;
  count: number = 30;
  activeSort: string = 'num_commits';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

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
    this.reloadData();
  }

  goToLink(url: string) {
    window.open(url, '_blank');
  }

  constructor(
    private dataService: DataService,
    public dialog: MatDialog,
    private location: Location,
    private route: ActivatedRoute
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
        let repos = repoData.jsonData;
        console.log(repos);
        this.repositories = [];
        repos.forEach((repository: any) => {
          let repo = repository;
          repo.institution_name_de = repo.institution;
          repo.organisation_name_de = repo.organization;
          this.repositories.push(repo);
        });
        this.dataSource = new MatTableDataSource(this.repositories);
        this.numRepositories = repoData.total;
        this.route.paramMap.subscribe((map) => {
          const repositoryName = map.get('repository');
          const organisation_name_de = map.get('institution');
          if (repositoryName && organisation_name_de) {
            let repository = this.repositories.find((repo) => {
              return (
                repo.organisation_name_de == organisation_name_de &&
                repo.name == repositoryName
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
        '/repositories/' +
          repository.organisation_name_de +
          '/' +
          repository.name
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

  @ViewChild(MatPaginator) paginator: MatPaginator;
}
