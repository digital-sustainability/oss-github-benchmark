import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DataService} from 'src/app/data.service';
import {IInstitution} from 'src/app/interfaces/institution';

@Component({
  selector: 'app-explore-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {
  item: IInstitution;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.loadData().then( data => {
      const itemName = this.route.snapshot.params.itemName;
      const institutions = Object.entries(data.jsonData).reduce( (previousValue, currentValue) => {
        const [key, value] = currentValue;
        return previousValue.concat(value);
      }, []);
      this.item = institutions.filter( inst => inst.name === itemName)[0];
    });
  }

  navigateTo(url: string): void {
    window.open(url, "_blank")
  }
}
