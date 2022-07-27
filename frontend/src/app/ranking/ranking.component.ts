import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { IInstitution } from 'src/app/interfaces/institution';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ExploreItemComponent } from '../explore-item/explore-item.component';
import { FormBuilder } from '@angular/forms';
import { timeout } from 'd3';

const sortState: Sort = { active: 'num_repos', direction: 'desc' };

interface sectorFilter {
  sector: string;
  activated: boolean;
  count: number;
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss'],
})
export class RankingComponent implements OnInit {
  item: IInstitution;
  innerWidth: any;
  displayedColumns: string[] = ['logo', 'name_de', 'num_repos'];
  @Input() data: IData;
  reposToDisplay = 6;
  dataSource: any = new MatTableDataSource();
  numInstitutions: number;
  checkboxes: string[] = [];
  sectorFilters: sectorFilter[] = [
    { sector: 'ResearchAndEducation', activated: false, count: 0 },
    { sector: 'NGOs', activated: false, count: 0 },
    { sector: 'Media', activated: false, count: 0 },
    { sector: 'Insurances', activated: false, count: 0 },
    { sector: 'IT', activated: false, count: 0 },
    { sector: 'Gov_Federal', activated: false, count: 0 },
    { sector: 'Gov_Companies', activated: false, count: 0 },
    { sector: 'Gov_Cities', activated: false, count: 0 },
    { sector: 'Gov_Cantons', activated: false, count: 0 },
    { sector: 'Communities', activated: false, count: 0 },
    { sector: 'Banking', activated: false, count: 0 },
    { sector: 'Others', activated: false, count: 0 },
  ];
  recordFilter = '';
  state: Date;
  institutions: any[];
  includeForks = false;
  window: any = window;

  doFilter = (value: string) => {
    if (value) {
      this.recordFilter = value;
    }
    setTimeout(this.triggerFilter, 100);
  };

  triggerFilter = () => {
    this.dataSource.filter = 'trigger filter';
    this.numInstitutions = this.dataSource.filteredData.length;
  };

  selectionChange(event) {
    this.checkboxes = event.value;
    this.doFilter('');
  }

  includeForksChange(checked: boolean) {
    this.includeForks = checked;
    if (checked) {
      this.dataSource.filteredData.forEach((element: any, index: number) => {
        this.dataSource.filteredData[index].num_repos =
          element.num_repos + element.total_num_forks_in_repos;
      });
    } else {
      this.dataSource.filteredData.forEach((element: any, index: number) => {
        this.dataSource.filteredData[index].num_repos =
          element.num_repos - element.total_num_forks_in_repos;
      });
    }
    this.triggerFilter();
  }

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private location: Location,
    fb: FormBuilder
  ) {
    this.sort = new MatSort();
    this.sectorFilters.forEach(
      (sector: { sector: string; activated: boolean }) => {
        if (sector.activated) {
          this.checkboxes.push(sector.sector);
        }
      }
    );
  }
  ngOnInit(): void {
    this.initDisplayedColumns();
    this.dataService.loadDataObservable().subscribe((data) => {
      this.route.paramMap.subscribe((map) => {
        if (!this.institutions) {
          const itemName = this.route.snapshot.params.itemName;
          this.institutions = this.getInstitutionsFromData(data);
          this.setInstitutionLocation();
          this.state =
            this.institutions[this.institutions.length - 1].timestamp;
          this.item = this.institutions.find(
            (inst) => inst.name_de === itemName
          );
          this.sortAndFilter(this.institutions);
          this.dataSource.filterPredicate = (
            dataSourceData: any,
            filter: string
          ) => {
            let datastring = '';
            let property: string;
            let filterNew = this.recordFilter;
            for (property in dataSourceData) {
              if (dataSourceData.hasOwnProperty(property)) {
                datastring += dataSourceData[property];
              }
            }
            datastring = datastring.replace(/\s/g, '').toLowerCase();
            filterNew = filterNew.replace(/\s/g, '').toLowerCase();
            return (
              datastring.includes(filterNew) &&
              (this.checkboxes.indexOf(dataSourceData.sector) !== -1 ||
                this.checkboxes.length === 0)
            );
          };
        }

        const institutionName = map.get('institution');
        if (institutionName) {
          this.openDialog(institutionName);
        }
      });
    });
  }

  getInstitutionsFromData(data: IData): any {
    const institutions = Object.entries(data.jsonData).reduce(
      (previousValue, currentValue) => {
        const [key, value] = currentValue;
        return previousValue.concat(value);
      },
      []
    );
    return institutions.filter((institution) => institution.orgs.length > 0);
  }

  private setInstitutionLocation(): void {
    this.institutions.forEach((institution, index) => {
      this.institutions[index].created_at = institution.orgs.sort(
        (b: any, a: any) => {
          return Date.parse(b.created_at) - Date.parse(a.created_at);
        }
      )[0].created_at;
      this.institutions[index].location = institution.orgs[0].location;
      let i = 0;
      while (
        !this.institutions[index].location &&
        i < institution.orgs.length
      ) {
        this.institutions[index].location = institution.orgs[i].location;
        i += 1;
      }
    });
  }

  private initDisplayedColumns(): void {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 500) {
      this.displayedColumns = [
        'logo',
        'name_de',
        'num_repos',
        'sector',
        'location',
        'created_at',
      ];
    }
    if (this.innerWidth > 1200) {
      this.displayedColumns.push('num_members', 'repo_names');
    }
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  openDialog(institutionName: string): void {
    const institution = this.institutions.find((inst) => {
      return inst.shortname === institutionName;
    });
    this.changeURL('/institutions/' + institution.shortname);
    const dialogRef = this.dialog.open(ExploreItemComponent, {
      data: { institution, includeForks: this.includeForks },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.changeURL('/institutions');
    });
  }

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }

  sortAndFilter(institutions: any): void {
    let i = 0;
    institutions.forEach((institution) => {
      const len = institution.repo_names.length;
      institutions[i].repo_names = institution.repo_names
        .slice(0, this.reposToDisplay)
        .join(', ');
      if (len >= this.reposToDisplay) {
        institutions[i].repo_names += '...';
      }
      if (
        this.sectorFilters.some((value: any) => {
          return value.sector === institution.sector;
        })
      ) {
        this.sectorFilters[
          this.sectorFilters.findIndex((value: any) => {
            return value.sector === institution.sector;
          })
        ].count += 1;
      }

      i++;
    });

    this.dataSource = new MatTableDataSource(institutions);
    this.dataSource.sort = this.sort;

    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    this.dataSource.paginator = this.paginator;
    this.numInstitutions = this.dataSource.filteredData.length;
    timeout(() => {
      this.includeForksChange(false);
    }, 100);
  }
}
