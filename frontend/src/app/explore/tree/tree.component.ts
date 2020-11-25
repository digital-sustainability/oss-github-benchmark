import { Component, Input, OnInit } from '@angular/core';
import {IData} from 'src/app/data.service';

@Component({
  selector: 'app-explore-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})
export class TreeComponent implements OnInit {

  @Input() data: IData;

  constructor() { }

  ngOnInit(): void {
  }

}
