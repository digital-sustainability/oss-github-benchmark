import {NestedTreeControl} from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {IInstitution} from '../../interfaces/institution';

@Component({
  selector: 'app-explore-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})
export class TreeComponent implements OnInit {

  @Input() data: IInstitution[];

  treeControl = new NestedTreeControl<GithubNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<GithubNode>();

  constructor() { }

  ngOnInit(): void {
    this.dataSource.data = this.data.map( institution => {
      return {
        name: institution.name,
        link: `https://github.com/${institution.name}`,
          children: institution.repos.map( repo => {
          return {
            name: repo.name,
            link: `https://github.com/${institution.name}/${repo.name}`
          };
        })
      };
    });
  }

  hasChild = (_: number, node: GithubNode) => !!node.children && node.children.length > 0;
}

interface GithubNode {
  name: string;
  link: string;
  children?: GithubNode[];
}
