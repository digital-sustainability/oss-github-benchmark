import { Component, ElementRef, Input, OnInit } from '@angular/core';
import {IData} from 'src/app/data.service';
import {Options} from '../options';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss']
})
export class LineComponent implements OnInit {

  @Input() data: IData;
  @Input() options: Options;
  svg: any;

  constructor(
    private hostElement: ElementRef
  ) { }

  ngOnInit(): void {
    const bound = this.hostElement.nativeElement.getBoundingClientRect();
    const width = bound.width;
    const height = bound.height - 64 - 40;
    const padding = 70;
  }

}
