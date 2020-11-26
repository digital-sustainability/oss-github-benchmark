import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {DataService, Metric} from '../data.service';
import {Options} from '../visualizations/options';

@Component({
  selector: 'app-dimension-selector',
  templateUrl: './dimension-selector.component.html',
  styleUrls: ['./dimension-selector.component.scss']
})
export class DimensionSelectorComponent implements OnInit {

  dimensionForm = this.fb.group({
    dimension1: 'total_num_contributors',
    dimension2: 'num_repos',
    dimension3: 'num_members',
  });

  @Output() optionsChange = new EventEmitter<Options>();
  metrics: Metric[];

  constructor(
    private dataService: DataService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.dataService.dimensionOptions.subscribe( ops => {
      this.metrics = ops;
      this.updateOptions();
    });
    this.dimensionForm.valueChanges.subscribe( () => {
      this.updateOptions();
    });
  }

  updateOptions(): void {
    const options = {
      dimension1: this.metrics.filter( m => m.key === this.dimensionForm.get('dimension1').value)[0],
      dimension2: this.metrics.filter( m => m.key === this.dimensionForm.get('dimension3').value)[0],
      dimension3: this.metrics.filter( m => m.key === this.dimensionForm.get('dimension3').value)[0],
    };
    this.optionsChange.emit(options);
  }

}
