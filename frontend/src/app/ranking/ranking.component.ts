import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { IInstitution } from 'src/app/interfaces/institution';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ExploreItemComponent } from '../explore/explore-item/explore-item.component';
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
  displayedColumns: string[] = ['rank', 'logo', 'name_de', 'num_repos'];
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

  resetRanks(): void {
    console.log(this.dataSource);
    this.dataSource._renderData._value = this.dataSource._renderData._value.map(
      (institution: any, index: number) => {
        let inst = institution;
        inst.rank = index + 1;
        return inst;
      }
    );
  }

  doFilter = (value: string) => {
    if (value) {
      this.recordFilter = value.trim().toLocaleLowerCase();
    }
    setTimeout(this.triggerFilter, 100);
  };

  triggerFilter = () => {
    this.dataSource.filter = 'trigger filter';
    this.numInstitutions = this.dataSource.filteredData.length;
    this.resetRanks();
  };

  selectionChange(event) {
    this.checkboxes = event.value;
    this.doFilter('');
  }

  includeForksChange(checked) {
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
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 500) {
      this.displayedColumns = [
        'rank',
        'logo',
        'name_de',
        'num_repos',
        'sector',
      ];
    }
    if (this.innerWidth > 1200) {
      this.displayedColumns.push('num_members', 'repo_names');
    }
    this.dataService.loadData().then((data) => {
      const itemName = this.route.snapshot.params.itemName;
      let institutions = Object.entries(data.jsonData).reduce(
        (previousValue, currentValue) => {
          const [key, value] = currentValue;
          return previousValue.concat(value);
        },
        []
      );
      this.state = institutions[institutions.length - 1].timestamp;
      this.item = institutions.find((inst) => inst.name_de === itemName);
      this.sortAndFilter(institutions);
    });
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  openDialog(institution: any) {
    this.changeURL('/ranking/' + institution.uuid);
    const dialogRef = this.dialog.open(ExploreItemComponent, {
      data: institution,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.changeURL('/ranking');
    });
  }

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }

  sortAndFilter(institutions: any) {
    let i = 0;
    institutions.forEach((institution) => {
      let len = institution.repo_names.length;
      institutions[i].repo_names = institution.repo_names
        .slice(0, this.reposToDisplay)
        .join(', ');
      if (len >= this.reposToDisplay) {
        institutions[i].repo_names += '...';
      }
      if (
        this.sectorFilters.some((value: any) => {
          return value.sector == institution.sector;
        })
      ) {
        this.sectorFilters[
          this.sectorFilters.findIndex((value: any) => {
            return value.sector == institution.sector;
          })
        ].count += 1;
      }

      i++;
    });
    this.route.paramMap.subscribe((map) => {
      const institutionName = map.get('institution');
      if (institutionName) {
        this.openDialog(
          institutions.find(
            (institution) =>
              institution.uuid.toLowerCase() === institutionName.toLowerCase()
          )
        );
      }
    });

    this.dataSource = new MatTableDataSource(institutions);
    this.dataSource.sort = this.sort;

    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    this.dataSource.paginator = this.paginator;
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
        datastring.includes(filterNew) &&
        (this.checkboxes.indexOf(data.sector) != -1 ||
          this.checkboxes.length == 0)
      );
    };
    this.numInstitutions = this.dataSource.filteredData.length;
    timeout(() => {
      this.includeForksChange(false);
    }, 100);
  }
}
