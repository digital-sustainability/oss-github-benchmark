import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService } from 'src/app/data.service';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Institution, InstitutionSumary } from 'src/app/types';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { InstitutionDetailViewComponent } from '../institution-detail-view/institution-detail-view.component';
import { FormsModule } from '@angular/forms';
import { DataExportService } from '../services/data-export.service';
import { AuthenticationService } from '../authentication.service';

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
  item: Institution;
  innerWidth: any;
  displayedColumns: string[] = ['logo', 'name_de', 'num_repos'];
  dataSource: any = new MatTableDataSource();
  numInstitutions: number;
  checkboxes: string[] = [];
  sectorFilters: sectorFilter[] = [];
  recordFilter = '';
  state: Date;
  completeInstitutions: Institution[];
  institutions: InstitutionSumary[];
  window: any = window;
  includeForks: boolean = false;
  page: number = 0;
  count: number = 30;
  activeSort: string = 'num_repos';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  latestUdpate: any;
  exportService: DataExportService = new DataExportService();

  searchTermRaw: string = '';

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
    let institutionData = await this.dataService.loadInstitutionSummaries({
      search: this.recordFilter,
      sort: this.activeSort,
      direction: this.sortDirection,
      page: this.page.toString(),
      count: this.count.toString(),
      includeForks: this.includeForks.toString(),
      sector: this.checkboxes,
    });
    this.latestUdpate = await this.dataService.loadLatestUpdate();
    let institutions = institutionData.institutions;
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
    this.institutions = institutions;
    //this.setInstitutionLocation();
    this.dataSource = new MatTableDataSource(this.institutions);
    this.numInstitutions = institutionData.total;
  }

  private setInstitutionLocation(): void {
    this.institutions.forEach((institution, index) => {
      /*if (institution.orgs.length)
        this.institutions[index].created_at = institution.orgs.sort(
          (b: any, a: any) => {
            return Date.parse(b.created_at) - Date.parse(a.created_at);
          }
        )[0].created_at;*/
      //else this.institutions[index].created_at = new Date(0);
      // if (!institution.[0]) this.institutions[index].location = '';
      // else this.institutions[index].location = ''; //institution.orgs[0].location;
      /*let i = 0;
      while (
        !this.institutions[index].location &&
        i < institution.orgs.length
      ) {
        this.institutions[index].location = institution.orgs[i].location;
        i += 1;
      }*/
    });
  }

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private location: Location,
    private authService: AuthenticationService,
  ) {
    this.sectorFilters.forEach(
      (sector: { sector: string; activated: boolean }) => {
        if (sector.activated) {
          this.checkboxes.push(sector.sector);
        }
      },
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
    const institution = await this.dataService.loadSingleInstitution({
      name: institutionName,
    });
    this.changeURL('/institutions/' + institutionName);
    const dialogRef = this.dialog.open(InstitutionDetailViewComponent, {
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

  isLoggedIn(): boolean {
    return this.authService.isUserLoggedIn();
  }

  // trigger export of the complete Institutions and organizations data
  async downloadData(){
    this.dataService
    .loadAllInstitutions()
    .then((institutionData) => {
      console.log("Received institutionData"); 
      if (institutionData && institutionData.institutions) {
        console.log("exporting data");
        this.completeInstitutions = institutionData.institutions;
        this.exportService.exportData(this.completeInstitutions, 'Institutions');
      } else {
        console.error("Invalid institution data or missing institutions property:");
      }
    })
    .catch((error) => {
      console.error("Error loading Institutions:", error);
    });

    this.dataService
    .loadAllOrganizations()
    .then((organizationData) => {
      console.log("Received organizationData"); 
      if (organizationData && organizationData.organizations) {
        console.log("exporting data");
        this.exportService.exportData(organizationData.organizations, 'Organizations');
      } else {
        console.error("Invalid organization data or missing organizations property:");
      }
    })
    .catch((error) => {
      console.error("Error loading organizations:", error);
    }
    );


  }


  @ViewChild(MatPaginator) paginator: MatPaginator;
}
