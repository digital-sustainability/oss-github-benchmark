import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService, IData } from 'src/app/data.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { IInstitution } from 'src/app/interfaces/institution';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ExploreItemComponent } from '../explore/explore-item/explore-item.component';
import { FormBuilder, FormGroup } from '@angular/forms';

const sortState: Sort = { active: 'num_repos', direction: 'desc' };

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss'],
})
export class RankingComponent implements OnInit {
  item: IInstitution;
  displayedColumns: string[] = [
    'logo',
    'name',
    'num_members',
    'num_repos',
    'sector',
    'repo_names',
  ];
  @Input() data: IData;
  reposToDisplay = 6;
  dataSource = new MatTableDataSource();
  numInstitutions: number;
  checkboxes: string[] = [];
  sectorFilter: object[] = [
    { sector: 'ResearchAndEducation', activated: true },
    { sector: 'NGOs', activated: true },
    { sector: 'Media', activated: true },
    { sector: 'Insurances', activated: true },
    { sector: 'IT', activated: true },
    { sector: 'Gov_Federal', activated: true },
    { sector: 'Gov_Companies', activated: true },
    { sector: 'Gov_Cities', activated: true },
    { sector: 'Gov_Cantons', activated: true },
    { sector: 'Communities', activated: true },
    { sector: 'Banking', activated: true },
    { sector: 'Others', activated: true },
  ];
  recordFilter = '';

  public doFilter = (value: string) => {
    if (value) {
      this.recordFilter = value.trim().toLocaleLowerCase();
    }
    setTimeout(this.triggerFilter, 100);
  };

  public triggerFilter = () => {
    this.dataSource.filter = 'trigger filter';
  };

  selectionChange(event) {
    this.checkboxes = event.value;
    this.doFilter('');
  }

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private location: Location,
    fb: FormBuilder
  ) {
    this.sort = new MatSort();
    this.sectorFilter.forEach(
      (sector: { sector: string; activated: boolean }) => {
        if (sector.activated) {
          this.checkboxes.push(sector.sector);
        }
      }
    );
  }

  ngOnInit(): void {
    this.dataService.loadData().then((data) => {
      const itemName = this.route.snapshot.params.itemName;
      const institutions = Object.entries(data.jsonData).reduce(
        (previousValue, currentValue) => {
          const [key, value] = currentValue;
          return previousValue.concat(value);
        },
        []
      );
      this.item = institutions.find((inst) => inst.name === itemName);

      let i = 0;
      institutions.forEach((element) => {
        let len = element.repo_names.length;
        institutions[i].repo_names = element.repo_names
          .slice(0, this.reposToDisplay)
          .join(', ');
        if (len >= this.reposToDisplay) {
          institutions[i].repo_names += '...';
        }
        i++;
      });
      this.route.paramMap.subscribe((map) => {
        const institutionName = map.get('institution');
        if (institutionName) {
          this.openDialog(
            institutions.find(
              (institution) =>
                institution.name.toLowerCase() === institutionName.toLowerCase()
            )
          );
        }
      });

      this.dataSource = new MatTableDataSource(institutions);
      this.numInstitutions = institutions.length;
      this.dataSource.sort = this.sort;

      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
      this.dataSource.paginator = this.paginator;
      this.dataSource.filterPredicate = (data: any, filter: string) => {
        let datastring: string = '';
        let property: string;
        for (property in data) {
          datastring += data[property];
        }
        return (
          datastring.includes(this.recordFilter) &&
          this.checkboxes.indexOf(data.sector) != -1
        );
      };
    });
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  openDialog(institution: any) {
    this.changeURL('/ranking/' + institution.name);
    const dialogRef = this.dialog.open(ExploreItemComponent, {
      data: institution,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.changeURL('/ranking');
    });
  }

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }
}
