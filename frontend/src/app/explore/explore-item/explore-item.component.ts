import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  ViewChild,
} from '@angular/core';
import { IInstitution } from 'src/app/interfaces/institution';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { lowerCase } from 'lodash-es';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

const sortState: Sort = { active: 'name', direction: 'desc' };

@Component({
  selector: 'app-explore-item',
  templateUrl: './explore-item.component.html',
  styleUrls: ['./explore-item.component.scss'],
})
export class ExploreItemComponent implements OnInit, AfterViewInit {
  item: IInstitution;
  displayedColumns: string[] = [
    'name',
    'num_commits',
    'num_contributors',
    'num_watchers',
    'fork',
    'num_stars',
    'num_forks',
  ];
  dataSource: any = 0;

  constructor(
    private dialogRef: MatDialogRef<ExploreItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.sort = new MatSort();
  }

  ngOnInit(): void {
    if (this.data.repos) {
      this.data.repos.forEach((repo) => {
        repo.name = lowerCase(repo.name);
      });
    }
    if (typeof this.data.avatar == 'string') {
      this.data.avatar = JSON.parse(this.data.avatar.replace(/\'/g, '"'));
    }
    if (this.data.repos.length > 0) {
      this.dataSource = new MatTableDataSource(this.data.repos);
    }
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
  }

  navigateTo(url: string): void {
    window.open(url, '_blank');
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}
