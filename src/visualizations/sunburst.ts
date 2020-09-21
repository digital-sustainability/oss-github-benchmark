import * as d3 from "d3";

const width = window.innerWidth;
const height = window.innerHeight - 64 - 40;
const radius = height / 2 - 20;

export interface ISunburstConfig {
  dimension1: string;
  dimension2: string;
  dimension3: string;
}

export class SunBurst {
  private svg: any;
  constructor(private element: HTMLElement) {}

  setup(state) {
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
      .padAngle(1 / radius)
      .padRadius(radius)
      .innerRadius((d) => Math.sqrt(d.y0))
      .outerRadius((d) => Math.sqrt(d.y1) - 1);

    const mousearc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => Math.sqrt(d.y0))
      .outerRadius(radius);

    // start building svg

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
      .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
      .style("max-width", `${width}px`)
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
      .on("mouseenter", (event, d) => {
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
  }
  update(state) { }

  partition(data) {
    return d3.partition().size([2 * Math.PI, radius * radius])(
      d3
        .hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );
  }

  prepareData(data, state) {
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
              value: 100,
              children: categorized[sector].map(inst => {
                  return {
                      name: inst.name,
                      value: inst["total_num_commits"],
                      children: inst.repos.map(repo => {
                          return {
                              name: repo.name,
                              value: repo["num_commits"]
                          }
                      })
                  }
              })
          }
      })
      return data1;
  }
}

interface ISunburstData {
    name: string;
    value: number;
    children: ISunburstData[]
}
