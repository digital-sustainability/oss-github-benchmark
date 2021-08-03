import { Component, OnInit, Inject } from '@angular/core';
import { lowerCase } from 'lodash-es';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-repository-detail-view',
  templateUrl: './repository-detail-view.component.html',
  styleUrls: ['./repository-detail-view.component.scss'],
})
export class RepositoryDetailViewComponent implements OnInit {
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
