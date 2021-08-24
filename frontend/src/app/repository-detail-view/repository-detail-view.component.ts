import { Component, OnInit, Inject } from '@angular/core';
import { lowerCase } from 'lodash-es';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-repository-detail-view',
  templateUrl: './repository-detail-view.component.html',
  styleUrls: ['./repository-detail-view.component.scss'],
})
export class RepositoryDetailViewComponent implements OnInit {
  repositoryStats: object[] = [
    { text: 'Archived:', content: 'archived', toNiceName: true },
    { text: 'Institution:', content: 'institution_name_de', toNiceName: false },
    {
      text: 'Organization:',
      content: 'organisation_name_de',
      toNiceName: false,
    },
    {
      text: 'Issues:',
      content: 'issues_all',
      toNiceName: false,
    },
    {
      text: 'Closed issues:',
      content: 'issues_closed',
      toNiceName: false,
    },
    {
      text: 'Commits last year:',
      content: 'last_years_commits',
      toNiceName: false,
    },
    // { text: 'License:', content: 'license', toNiceName: false },
    {
      text: 'Commits:',
      content: 'num_commits',
      toNiceName: false,
    },
    { text: 'Contributors:', content: 'num_contributors', toNiceName: false },
    { text: 'Forks:', content: 'num_forks', toNiceName: false },
    { text: 'Stars:', content: 'num_stars', toNiceName: false },
    {
      text: 'Watchers:',
      content: 'num_watchers',
      toNiceName: false,
    },
    {
      text: 'Pull requests:',
      content: 'pull_requests_all',
      toNiceName: false,
    },
    {
      text: 'Closed pull requests:',
      content: 'pull_requests_closed',
      toNiceName: false,
    },
    { text: 'License:', content: 'license', toNiceName: false },
    {
      text: 'Repo created on GitHub:',
      content: 'created_at',
      toNiceName: false,
    },
    {
      text: 'Repo updated on GitHub:',
      content: 'updated_at',
      toNiceName: false,
    },
  ];

  constructor(
    private dialogRef: MatDialogRef<RepositoryDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      console.log(this.data);
    }
  }
}
