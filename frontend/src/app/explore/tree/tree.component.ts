import {NestedTreeControl} from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {ISector} from '../../interfaces/institution';

@Component({
  selector: 'app-explore-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})
export class TreeComponent implements OnInit {

  @Input() data: ISector;

  treeControl = new NestedTreeControl<GithubNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<GithubNode>();

  constructor() { }

  ngOnInit(): void {
    this.dataSource.data = Object.entries(this.data).map( ([sectorName, institution]) => {
      return {
        name: sectorName,
        link: null,
        children: institution.map( inst => {
          return {
            name: inst.name,
            link: `/explore/item/${sectorName}`,
            children: inst.orgs.map( org => {
              return {
                name: org.name,
                link: org.url,
                children: org.repos.map( repo => {
                  return {
                    name: repo.name,
                    url: repo.url
                  };
                })
              };
            })
          };
        })
      };
    });
  }

  hasChild = (_: number, node: GithubNode) => !!node.children && node.children.length > 0;
}

interface GithubNode {
  name: string;
  link?: string;
  children?: GithubNode[];
}
