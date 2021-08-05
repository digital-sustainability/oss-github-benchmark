import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { IInstitution } from 'src/app/interfaces/institution';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { RepositoryDetailViewComponent } from '../repository-detail-view/repository-detail-view.component';
import { ActivatedRoute } from '@angular/router';

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
    ['last_years_commits', 'Commits last year', false, 'number'],
    ['comments', 'Comments', false, 'number'],
    ['issues_all', 'Issues', false, 'number'],
    ['pull_requests_all', 'Pull requests', false, 'number'],
    ['num_commits', 'Commits', false, 'number'],
    ['num_contributors', 'Contributors', false, 'number'],
    ['num_forks', 'Forks', false, 'number'],
    ['num_stars', 'Stars', false, 'number'],
    ['has_own_commits', 'Own commits', false, 'number'],
    ['fork', 'Is fork?', true, 'string'],
  ];
  displayedColumnsOnlyNames = this.displayedColumns.map((column) => column[0]);
  recordFilter = '';
  @Input() data: IData;
  dataSource: any = new MatTableDataSource();
  numRepositories: number;
  state: Date;
  repositories: any[] = [];
  includeForks: boolean = false;

  doFilter = (value: string) => {
    if (value) {
      this.recordFilter = value.trim().toLocaleLowerCase();
    }
    setTimeout(this.triggerFilter, 100);
  };

  triggerFilter = () => {
    this.dataSource.filter = 'trigger filter';
    this.numRepositories = this.dataSource.filteredData.length;
  };

  includeForksChange(checked) {
    this.includeForks = checked;
    this.triggerFilter();
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

  ngOnInit(): void {
    this.dataService.loadData().then((data) => {
      let institutions = Object.entries(data.jsonData).reduce(
        (previousValue, currentValue) => {
          const [key, value] = currentValue;
          return previousValue.concat(value);
        },
        []
      );
      this.state = institutions[institutions.length - 1].timestamp;
      institutions.forEach((institution: any) => {
        institution.orgs.forEach((org: any) => {
          org.repos.forEach((repository: any) => {
            let repo = repository;
            repo.institution_name_de = institution.name_de;
            repo.organisation_name_de = org.name;
            repo.logo = org.avatar;
            this.repositories.push(repo);
          });
        });
      });
      this.dataSource = new MatTableDataSource(this.repositories);
      this.numRepositories = this.repositories.length;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      setTimeout(this.triggerFilter, 100);

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
          datastring.includes(filterNew) && (!data.fork || this.includeForks)
        );
      };
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

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

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
}
