import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DataService } from 'src/app/data.service';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { User } from '../types';
import { DataExportService } from '../services/data-export.service';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-user-ranking',
  templateUrl: './user-ranking.component.html',
  styleUrls: ['./user-ranking.component.scss'],
})
export class UserRankingComponent implements OnInit {
  displayedColumns: any[] = [
    ['avatar_url', '', false, 'img'],
    ['name', 'Name', false, 'string'],
    ['login', 'Github user', false, 'string'],
    ['company', 'Company', false, 'string'],
    ['location', 'Location', false, 'string'],
    ['twitter_username', 'Twitter', false, 'string'],
    ['contributions_sum', 'Contributions', false, 'number'],
    ['public_repos', 'Public repos', false, 'number'],
    ['public_gists', 'Public gists', false, 'number'],
    ['followers', 'Followers', false, 'number'],
    ['created_at', 'Created at', false, 'date'],
    ['updated_at', 'Updated at', false, 'date'],
  ];
  displayedColumnsOnlyNames = this.displayedColumns.map((column) => column[0]);
  recordFilter = '';
  searchTermRaw = '';
  dataSource: any = new MatTableDataSource();
  numUsers: number;
  state: Date;
  users: User[] = [];
  page: number = 0;
  count: number = 30;
  activeSort: string = 'followers';
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

  goToLink(url: string) {
    window.open(url, '_blank');
  }

  reloadData(): void {
    this.dataService
      .loadUserData({
        search: this.recordFilter,
        sort: this.activeSort,
        direction: this.sortDirection,
        page: this.page.toString(),
        count: this.count.toString(),
      })
      .then((userData) => {
        this.users = userData.users;
        console.log(this.users);
        this.dataSource = new MatTableDataSource(this.users);
        this.numUsers = userData.total;
      });
  }

  constructor(
    private dataService: DataService,
    private location: Location,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
  ) {}

  ngOnInit(): void {
    this.reloadData();
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

  downloadData(){
    this.dataService
    .loadAllUsers()
    .then((userData) => {
      console.log("Received userData:", userData);  // Add this line to log the response
      if (userData && userData.users) {
        console.log("exporting data");
        this.users = userData.users;
        this.exportService.exportData(this.users, 'users');
      } else {
        console.error("Invalid user data or missing users property:", userData);
      }
    })
    .catch((error) => {
      console.error("Error loading users:", error);
    });

  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
}
