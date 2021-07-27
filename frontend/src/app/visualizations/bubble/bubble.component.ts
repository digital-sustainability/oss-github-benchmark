import { Component, OnInit, Input, ElementRef, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { IData } from 'src/app/data.service';
import * as _ from 'lodash-es';
import { Options } from '../options';
import { MatDialog } from '@angular/material/dialog';
import { ExploreItemComponent } from '../../explore/explore-item/explore-item.component';
import { Location } from '@angular/common';
@Component({
  selector: 'app-visualization-bubble',
  templateUrl: './bubble.component.html',
  styleUrls: ['./bubble.component.scss'],
})
export class BubbleComponent implements OnInit, OnChanges {
  @Input() data: IData;
  @Input() options: Options;
  svg: any;
  text: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  yscale: d3.ScaleLinear<number, number, never>;
  yAxis: d3.Axis<d3.AxisDomain>;
  xscale: d3.ScaleLinear<number, number, never>;
  xAxis: d3.Axis<d3.AxisDomain>;
  xAxisGroup: any;
  yAxisGroup: any;
  xLabel: any;
  yLabel: any;
  g: any;
  colorScale: d3.ScaleOrdinal<unknown, string, never>;
  institutionsComplete: any;

  constructor(
    private hostElement: ElementRef,
    public dialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit(): void {
    const bound = this.hostElement.nativeElement.getBoundingClientRect();
    const width = bound.width;
    const height = bound.height - 64 - 40;
    const padding = 70;

    this.svg = d3
      .select(this.hostElement.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.text = d3
      .select(this.hostElement.nativeElement)
      .append('div')
      .style('visibility', 'hidden')
      .style('position', 'absolute')
      .style('opacity', '0');

    this.yscale = d3.scaleLinear().range([height - padding, padding]);

    this.yAxis = d3.axisLeft(this.yscale).ticks(5);

    this.xscale = d3.scaleLinear().range([padding, width - padding]);

    this.xAxis = d3.axisBottom(this.xscale).ticks(5);

    this.colorScale = d3.scaleOrdinal();

    this.xAxisGroup = this.svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + (height - padding) + ')');

    this.yAxisGroup = this.svg
      .append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + padding + ',0)');

    this.xLabel = this.svg
      .append('text')
      .attr(
        'transform',
        'translate(' + width / 2 + ' ,' + (height - (1 / 4) * padding) + ')'
      )
      .style('text-anchor', 'middle');

    this.yLabel = this.svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', padding / 4)
      .attr('x', 0 - height / 2)
      .style('text-anchor', 'middle');

    if (this.data) {
      this.update();
    }
  }

  ngOnChanges() {
    if (this.svg && this.data && this.options) {
      this.update();
    }
  }

  update() {
    const bound = this.hostElement.nativeElement.getBoundingClientRect();
    const width = bound.width;
    const xDimension = (institution: any) =>
      parseInt(institution[this.options.dimension1.key], 10);
    const yDimension = (institution: any) =>
      parseInt(institution[this.options.dimension2.key], 10);
    const rDimension = (institution: any) =>
      parseInt(institution[this.options.dimension3.key], 10);

    const dataJson: any = this.data.jsonData;
    const data = this.data.csvData;

    let tmp: any[] = [];
    Object.keys(dataJson).forEach((branch) => {
      dataJson[branch].forEach((inst) => {
        tmp.push(inst);
      });
    });

    this.institutionsComplete = tmp;

    const sector = (i) => i.sector;

    this.yscale.domain([
      d3.min(data.map(yDimension)),
      d3.max(data.map(yDimension)),
    ]);

    this.xscale.domain([
      d3.min(data.map(xDimension)),
      d3.max(data.map(xDimension)),
    ]);

    this.colorScale.domain(_.uniq(data.map(sector))).range(d3.schemePaired);

    const sizeScale = d3
      .scaleLinear()
      .range([4, 30])
      .domain([d3.min(data.map(rDimension)), d3.max(data.map(rDimension))]);

    this.g = this.svg.selectAll('g circle').data(data);

    this.g
      .enter()
      .append('g')
      .attr('transform', function (d, i) {
        return 'translate(0,0)';
      })
      .append('circle')

      .merge(this.g)

      .attr('cx', (inst, i) => {
        return this.xscale(xDimension(inst));
      })

      .attr('cy', (inst, i) => {
        return this.yscale(yDimension(inst));
      })

      .attr('r', (inst) => {
        return sizeScale(rDimension(inst));
      })

      .attr('svg:title', (inst) => inst.name_de)

      .attr('fill', (inst, i) => {
        return this.colorScale(inst.sector);
      })
      .on('click', (event, inst) => {
        this.openDialog(inst);
        // this.onselect(inst);
      })
      .on('mouseenter', (event, inst) => {
        const img = JSON.parse(inst.avatar.replace(/'/g, '"'))[0];
        this.text
          .html(
            `<img src='${img}' height=25 ><br>
                    ${inst.name_de}<br>
                    ${this.options.dimension1.friendly_name}: ${xDimension(
              inst
            )}<br>
                    ${this.options.dimension2.friendly_name}: ${yDimension(
              inst
            )}<br>
                    ${this.options.dimension3.friendly_name}: ${rDimension(
              inst
            )}`
          )
          // .style('display', 'block')
          .style('opacity', 0.8)
          .style('visibility', null)
          .style('top', `${this.yscale(yDimension(inst)) + 20}px`)
          .style('left', `${this.xscale(xDimension(inst)) + 20}px`);
      })
      .on('mouseleave', () => {
        this.text.style('opacity', 0).style('visibility', 'hidden');
      });

    this.xAxisGroup.call(this.xAxis);

    this.yAxisGroup.call(this.yAxis);
    this.xLabel.text(this.options.dimension1.friendly_name);
    this.yLabel.text(this.options.dimension2.friendly_name);
  }

  openDialog(institution: any) {
    let institutionData = this.institutionsComplete.find(
      (institutionC) => institutionC.uuid === institution.uuid
    );
    this.changeURL('/visualization/' + institution.uuid);
    const dialogRef = this.dialog.open(ExploreItemComponent, {
      data: institutionData,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.changeURL('/visualization');
    });
  }

  changeURL(relativeUrl: string): void {
    this.location.replaceState(relativeUrl);
  }
}
