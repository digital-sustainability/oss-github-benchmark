import { Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import {IData} from 'src/app/data.service';
import {Options} from '../options';
import * as d3 from 'd3';
import {IInstitution} from 'src/app/interfaces/institution';

@Component({
  selector: 'app-visualization-sunburst',
  templateUrl: './sunburst.component.html',
  styleUrls: ['./sunburst.component.scss']
})
export class SunburstComponent implements OnInit, OnChanges {

  @Input() data: IData;
  @Input() options: Options;
  svg: any;
  element: any;
  arc: d3.Arc<any, d3.DefaultArcObject>;
  radius: number;
  label: any;
  color: d3.ScaleOrdinal<string, unknown, never>;
  mousearc: d3.Arc<any, d3.DefaultArcObject>;

  // Generate a string that describes the points of a breadcrumb SVG polygon.
  static breadcrumbPoints(d, i) {
    const breadcrumbWidth = 75;
    const breadcrumbHeight = 30;
    const tipWidth = 10;
    const points = [];
    points.push("0,0");
    points.push(`${breadcrumbWidth},0`);
    points.push(`${breadcrumbWidth + tipWidth},${breadcrumbHeight / 2}`);
    points.push(`${breadcrumbWidth},${breadcrumbHeight}`);
    points.push(`0,${breadcrumbHeight}`);
    if (i > 0) {
      // Leftmost breadcrumb; don't include 6th vertex.
      points.push(`${tipWidth},${breadcrumbHeight / 2}`);
    }
    return points.join(" ");
  }

  constructor(private hostElement: ElementRef) { }

  ngOnInit(): void {
    const bound = this.hostElement.nativeElement.getBoundingClientRect();
    const width = bound.width;
    const height = bound.height - 64 - 40;
    const padding = 70;
    this.radius = width / 2 - padding;

    this.svg = d3.select(this.hostElement.nativeElement).append('svg');
    this.svg
      .attr('viewBox', `${-this.radius} ${-this.radius} ${width} ${width}`)
      .style('max-width', `${width}px`)
      .style('font', '12px sans-serif');

    // Make this into a view, so that the currently hovered sequence is available to the breadcrumb
    this.element = this.svg.node();
    this.element.value = { sequence: [], percentage: 0.0 };

    this.arc = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle(1 / this.radius)
      .padRadius(this.radius)
      .innerRadius((d: any) => Math.sqrt(d.y0))
      .outerRadius((d: any) => Math.sqrt(d.y1) - 1);

    this.mousearc = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .innerRadius((d: any) => Math.sqrt(d.y0))
      .outerRadius(this.radius);

    // Just setup
    this.color = d3
      .scaleOrdinal()
      .domain(['home', 'product', 'search', 'account', 'other', 'end'])
      .range([
        '#5d85cf',
        '#7c6561',
        '#da7847',
        '#6fb971',
        '#9e70cf',
        '#bbbbbb',
      ]);

    this.label = this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .style('visibility', 'hidden');

    this.label
      .append('tspan')
      .attr('class', 'percentage')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', '-0.1em')
      .attr('font-size', '3em')
      .text('');

    this.label
      .append('tspan')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', '1.5em')
      .text('of visits begin with this sequence');

    if (this.data) {
      this.update();
    }
  }

  ngOnChanges(): void {
    if (this.svg && this.data && this.options) {
      this.update();
    }
  }

  update(): void {
    const preparedData = this.prepareData(this.data.jsonData);
    const root = this.partition(preparedData);

    const path = this.svg
      .append('g')
      .selectAll('path')
      .data(
        root.descendants().filter((d) => {
          // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
          return d.depth && d.x1 - d.x0 > 0.001;
        })
      )
      .join('path')
      .attr('fill', (d) => this.color(d.data.name))
      .attr('d', this.arc);

    this.svg
      .append('g')
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseleave', () => {
        path.attr('fill-opacity', 1);
        this.label.style('visibility', 'hidden');
        // Update the value of this view
        this.element.value = { sequence: [], percentage: 0.0 };
        this.element.dispatchEvent(new CustomEvent('input'));
      })
      .selectAll('path')
      .data(
        root.descendants().filter((d) => {
          // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
          return d.depth && d.x1 - d.x0 > 0.001;
        })
      )
      .join('path')
      .attr('d', this.mousearc)
      .on('mouseenter', (d) => {
        // Get the ancestors of the current segment, minus the root
        const sequence = d.ancestors().reverse().slice(1);
        // Highlight the ancestors
        path.attr('fill-opacity', (node) =>
          sequence.indexOf(node) >= 0 ? 1.0 : 0.3
        );
        const percentage = ((100 * d.value) / root.value).toPrecision(3);
        this.label
          .style('visibility', null)
          .select('.percentage')
          .text(percentage + '%');
        // Update the value of this view with the currently hovered sequence and percentage
        this.element.value = { sequence, percentage };
        this.element.dispatchEvent(new CustomEvent('input'));
      });

  }

  partition(data) {
    return d3.partition().size([2 * Math.PI, this.radius * this.radius])(
      d3
        .hierarchy(data)
        .sum((d) => d.total ? d.total : d.value)
        .sort((a, b) => b.value - a.value)
    );
  }

  prepareData(data: IInstitution[]) {
      const categorized = {
          other: []
      }

      data.forEach( inst => {
          if (inst.sector) {
              if (categorized.hasOwnProperty(inst.sector)) {
                  categorized[inst.sector].push(inst);
              } else {
                  categorized[inst.sector] = [inst];
              }
          } else {
              categorized.other.push(inst);
          }
      });
      const data1 = Object.keys(categorized).map( sector => {
          return {
              name: sector,
              children: categorized[sector].map(inst => {
                  return {
                      name: inst.name,
                      total: inst['total_num_commits'],
                      children: inst.repos.map(repo => {
                          return {
                              name: repo.name,
                              total: repo['num_commits']
                          };
                      })
                  };
              })
          };
      });
      return {
        name: 'root',
        children: data1
      };
  }

}
