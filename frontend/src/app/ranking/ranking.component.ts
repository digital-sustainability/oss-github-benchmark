import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { DataService, IData } from 'src/app/data.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { IInstitution } from 'src/app/interfaces/institution';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ExploreItemComponent } from '../explore/explore-item/explore-item.component';

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

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  };

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.sort = new MatSort();
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
      this.dataSource.sort = this.sort;

      this.sort.active = sortState.active;
      this.sort.direction = sortState.direction;
      this.sort.sortChange.emit(sortState);
      this.dataSource.paginator = this.paginator;
    });
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  openDialog(institution: any) {
    this.dialog.open(ExploreItemComponent, {
      data: institution,
    });
  }
}
