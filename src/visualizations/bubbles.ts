import * as d3 from "d3";
import * as _ from "lodash";
import {VisualizationType, IState} from "../interfaces/VisualizationType";




export class Bubble implements VisualizationType {
    private svg: any;
    private text: any;
    private g: any;
    yscale: any;
    yAxis: any;
    xscale: any;
    xAxis: any;
    xAxisGroup: any;
    yAxisGroup: any;
    xLabel: any;
    yLabel: any;

    private options;

    constructor(private element, private onselect) {
    }

    setup(state) {
        this.options = {
            dimension1: state.dimension1,
            dimension2: state.dimension2,
            dimension3: state.dimension3
        };

        const bound = this.element.getBoundingClientRect();
        const width = bound.width;
        const height = bound.height-64-40;
        const padding = 70;

        const data = state.csvData;
        // var data = [10, 20, 30];
        const orgs = [];
        console.log(data);
        // data.sort(
        //     (a, b) => parseInt(b.num_members) - parseInt(a.num_members)
        // );
        const colors = ["green", "purple", "yellow"];

        this.svg = d3
        .select(this.element)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

        this.text = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", "0");

        this.yscale = d3
        .scaleLinear()
        .range([height - padding, padding]);

        this.yAxis = d3
        .axisLeft()
        .ticks(5);

        this.xscale = d3
        .scaleLinear()
        .range([padding, width - padding]);

        this.xAxis = d3
        .axisBottom()
        .ticks(5);


        this.xAxisGroup = this.svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - padding) + ")")

        this.yAxisGroup = this.svg
        .append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + padding + ",0)")

        this.xLabel = this.svg
        .append("text")
        .attr("transform",
              "translate(" + (width/2) + " ," + 
                  (height - 1/4 * padding ) + ")")
              .style("text-anchor", "middle")
              .text(this.options.dimension1);

        this.yLabel = this.svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", padding/4)
        .attr("x",0 - (height / 2))
        .style("text-anchor", "middle")
        .text(this.options.dimension2);

        this.update(state);
    }

    update(state) {
        this.options = {
            dimension1: state.dimension1,
            dimension2: state.dimension2,
            dimension3: state.dimension3
        };

        const bound = this.element.getBoundingClientRect();
        const width = bound.width;
        const height = bound.height-64-40;
        const padding = 70;

        const orgs = [];
        const xDimension = (institution: any) => parseInt(institution[this.options.dimension1]);
        const yDimension = (institution: any) => parseInt(institution[this.options.dimension2]);
        const rDimension = (institution: any) => parseInt(institution[this.options.dimension3]);
        const data = state.csvData;

        var sector = i => i.sector;

        this.yscale.domain([
            d3.min(data.map(yDimension)),
            d3.max(data.map(yDimension))
        ])

        this.yAxis.scale(this.yscale)

        this.xscale.domain([
            d3.min(data.map(xDimension)),
            d3.max(data.map(xDimension))
        ])

        this.xAxis.scale(this.xscale)
        // var xscale = d3.scaleBand(data.map(i => i.name), [20, 270]);

        var colorScale = d3.scaleOrdinal(
            _.uniq(data.map(sector)),
            d3.schemePaired
        );


        const sizeScale = d3
            .scaleLinear()
            .range([4, 30])
            .domain([
                d3.min(data.map(rDimension)),
                d3.max(data.map(rDimension))
            ]);

        this.g = this.svg
        .selectAll("g circle")
        .data(data)

        this.g
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate(0,0)";
            })
            .append("circle")

            .merge(this.g)


            .attr("cx", (inst, i) => {
                return this.xscale(xDimension(inst));
            })

            .attr("cy", (inst, i) => {
                return this.yscale(yDimension(inst));
            })

            .attr("r", (inst) => {
                return sizeScale(rDimension(inst));
            })

            .attr("svg:title", inst => inst.name)

            .attr("fill", (inst, i) => {
                return colorScale(inst.sector);
            })
            .on("click", inst => {
                debugger;
                this.onselect(inst);
            })
            .on("mouseover", inst => {
                var img = eval(inst.avatar)[0];
                this.text
                .html(
                    `<img src="${img}" height=25 ><br>
                    ${inst.name}<br>
                    Repos: ${yDimension(inst)}<br>
                    Contributors: ${inst.total_num_contributors}<br>
                    Members: ${rDimension(inst)}`
                )
                .style("display", "block")

                .style(
                    "top",
                    this.yscale(yDimension(inst)) - sizeScale(rDimension(inst))
                )
                //   .transition()
                //   .duration(200)
                .style("opacity", 0.8);
                if (this.xscale(xDimension(inst)) > width / 2) {
                    this.text
                    .style(
                        "right",
                        width -
                            (this.xscale(xDimension(inst)) + sizeScale(rDimension(inst)))
                    )
                    .style("left", undefined);
                } else {
                    this.text
                    .style(
                        "left",
                        this.xscale(xDimension(inst)) + sizeScale(rDimension(inst))
                    )
                    .style("right", undefined);
                }
            })
            .on("mouseout", inst => {
                this.text.style("opacity", 0).style("display", "none");
            });

        this.xAxisGroup.call(this.xAxis);

        this.yAxisGroup.call(this.yAxis);
        this.xLabel.text(this.options.dimension1);
        this.yLabel.text(this.options.dimension2);
        // g.append("text")
        //   .attr("x", function(inst, i) {
        //     return xscale(contributors(inst));
        //   })

        //   .attr("y", function(inst, i) {
        //     return yscale(parseInt(inst.num_repos));
        //   })

        //   .attr("stroke", "teal")
        //   .attr("hidden", true)
        //   .attr("font-size", "10px")
        //   .attr("font-family", "sans-serif")
        //   .text(inst => inst.name);
        


    }

}


function repoList(institution) {
  const el = document.getElementById("repoList");
  while (el.firstChild) {
    el.removeChild(el.lastChild);
  }
  const repos = JSON.parse(institution.repo_names.replace(/'/g, '"'));
  const orgs = JSON.parse(institution.orgs.replace(/'/g, '"'));
  repos.forEach((repo) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "https://github.com/" + orgs[0] + "/" + repo;
    a.target = "_blank";
    const content = document.createTextNode(repo);
    a.appendChild(content);
    li.appendChild(a);
    el.append(li);
  });

  const modal = document.getElementById("myModal");
  modal.style.display = "block";
}

