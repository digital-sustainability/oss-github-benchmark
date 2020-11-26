import * as d3 from "d3";
import {VisualizationType} from "../interfaces/VisualizationType";
import {IState} from "../interfaces/State";
import {IInstitution} from "../interfaces/Institution";

// const width = window.innerWidth;
// const height = window.innerHeight - 64 - 40;

export interface ISunburstConfig {
  dimension1: string;
  dimension2: string;
  dimension3: string;
}

const breadcrumbWidth = 75
const breadcrumbHeight = 30

export class SunBurst implements VisualizationType {
  private svg: any;
  width: number;
  height: number;
  radius: number;
  constructor(private element: HTMLElement) {
    const bound = this.element.getBoundingClientRect();
    this.width = bound.width;
    this.height = bound.height;
    this.radius = this.height / 2 - 20;
  }

  setup(state: IState) {
    const data = state.jsonData;
    debugger;
    const preparedData = this.prepareData(data, state);
    const root = this.partition(preparedData);
    this.svg = d3.select(this.element).append("svg");
    // Make this into a view, so that the currently hovered sequence is available to the breadcrumb
    const element = this.svg.node();
    element.value = { sequence: [], percentage: 0.0 };

    // definitions
    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle(1 / this.radius)
      .padRadius(this.radius)
      .innerRadius((d) => Math.sqrt(d.y0))
      .outerRadius((d) => Math.sqrt(d.y1) - 1);

    const mousearc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => Math.sqrt(d.y0))
      .outerRadius(this.radius);

    // start building svg

    // Just setup
    const color = d3
      .scaleOrdinal()
      .domain(["home", "product", "search", "account", "other", "end"])
      .range([
        "#5d85cf",
        "#7c6561",
        "#da7847",
        "#6fb971",
        "#9e70cf",
        "#bbbbbb",
      ]);

    const label = this.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .style("visibility", "hidden");

    label
      .append("tspan")
      .attr("class", "percentage")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "-0.1em")
      .attr("font-size", "3em")
      .text("");

    label
      .append("tspan")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "1.5em")
      .text("of visits begin with this sequence");

    this.svg
      .attr("viewBox", `${-this.radius} ${-this.radius} ${this.width} ${this.width}`)
      .style("max-width", `${this.width}px`)
      .style("font", "12px sans-serif");

    const path = this.svg
      .append("g")
      .selectAll("path")
      .data(
        root.descendants().filter((d) => {
          // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
          return d.depth && d.x1 - d.x0 > 0.001;
        })
      )
      .join("path")
      .attr("fill", (d) => color(d.data.name))
      .attr("d", arc);

    this.svg
      .append("g")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseleave", () => {
        path.attr("fill-opacity", 1);
        label.style("visibility", "hidden");
        // Update the value of this view
        element.value = { sequence: [], percentage: 0.0 };
        element.dispatchEvent(new CustomEvent("input"));
      })
      .selectAll("path")
      .data(
        root.descendants().filter((d) => {
          // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
          return d.depth && d.x1 - d.x0 > 0.001;
        })
      )
      .join("path")
      .attr("d", mousearc)
      .on("mouseenter", (d) => {
        // Get the ancestors of the current segment, minus the root
        const sequence = d.ancestors().reverse().slice(1);
        // Highlight the ancestors
        path.attr("fill-opacity", (node) =>
          sequence.indexOf(node) >= 0 ? 1.0 : 0.3
        );
        const percentage = ((100 * d.value) / root.value).toPrecision(3);
        label
          .style("visibility", null)
          .select(".percentage")
          .text(percentage + "%");
        // Update the value of this view with the currently hovered sequence and percentage
        element.value = { sequence, percentage };
        element.dispatchEvent(new CustomEvent("input"));
      });

  }

  update(state: IState) { }

  partition(data) {
    return d3.partition().size([2 * Math.PI, this.radius * this.radius])(
      d3
        .hierarchy(data)
        .sum((d) => d.total ? d.total : d.value)
        .sort((a, b) => b.value - a.value)
    );
  }

  prepareData(data: IInstitution[], state) {
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
                              total: repo["num_commits"]
                          }
                      })
                  }
              })
          }
      });
      return {
        name: "root",
        children: data1
      };
  }
  // Generate a string that describes the points of a breadcrumb SVG polygon.
  static breadcrumbPoints(d, i) {
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
}

interface ISunburstData {
    name: string;
    value: number;
    children: ISunburstData[]
}
