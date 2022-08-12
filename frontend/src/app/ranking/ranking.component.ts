import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { IInstitution } from 'src/app/interfaces/institution';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ExploreItemComponent } from '../explore-item/explore-item.component';
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
  sectorFilters: sectorFilter[] = [];
  recordFilter = '';
  state: Date;
  institutions: any[];
  window: any = window;
  includeForks: boolean = false;
  page: number = 0;
  count: number = 30;
  activeSort: string = 'num_repos';
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

  selectionChange(event) {
    this.checkboxes = event.value;
    this.reloadData();
  }

  async reloadData() {
    let institutionData = await this.dataService.loadInstitutionData({
      search: this.recordFilter,
      sort: this.activeSort,
      direction: this.sortDirection,
      page: this.page.toString(),
      count: this.count.toString(),
      includeForks: this.includeForks.toString(),
      sendStats: 'false',
      sector: this.checkboxes,
    });
    let institutions = institutionData.jsonData;
    this.sectorFilters = [];
    for (const sector in institutionData.sectors) {
      if (
        Object.prototype.hasOwnProperty.call(institutionData.sectors, sector)
      ) {
        const count = institutionData.sectors[sector];
        this.sectorFilters.push({
          sector: sector,
          activated: false,
          count: count,
        });
      }
    }
    institutions.forEach((institution, i) => {
      const len = institution.repo_names.length;
      institutions[i].repo_names = institution.repo_names
        .slice(0, this.reposToDisplay)
        .join(', ');
      if (len >= this.reposToDisplay) {
        institutions[i].repo_names += '...';
      }
    });
    this.institutions = institutions;
    this.setInstitutionLocation();
    this.dataSource = new MatTableDataSource(this.institutions);
    this.numInstitutions = institutionData.total;
  }

  private setInstitutionLocation(): void {
    this.institutions.forEach((institution, index) => {
      if (institution.orgs.length)
        this.institutions[index].created_at = institution.orgs.sort(
          (b: any, a: any) => {
            return Date.parse(b.created_at) - Date.parse(a.created_at);
          }
        )[0].created_at;
      else this.institutions[index].created_at = new Date(0);
      if (!institution.orgs[0]) this.institutions[index].location = '';
      else this.institutions[index].location = institution.orgs[0].location;
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

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private location: Location
  ) {
    this.sectorFilters.forEach(
      (sector: { sector: string; activated: boolean }) => {
        if (sector.activated) {
          this.checkboxes.push(sector.sector);
        }
      }
    );
  }

  async ngOnInit(): Promise<void> {
    this.initDisplayedColumns();
    await this.reloadData();
    this.route.paramMap.subscribe((map) => {
      const institutionName = map.get('institution');
      if (institutionName) {
        this.openDialog(institutionName);
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

  async openDialog(institutionName: string): Promise<void> {
    const institution = (
      await this.dataService.loadInstitutionData({
        findName: institutionName,
        sendStats: 'true',
      })
    ).jsonData;
    console.log(institution);
    this.changeURL('/institutions/' + institutionName);
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
