import * as d3 from "d3";
import * as _ from "lodash";

const width = window.innerWidth;
const height = window.innerHeight-64;
const padding = 70;

export const Bubble = {
    setup,
    redraw
}


export class Bubble {
    private svg;

    constructor() {
    }

    setup(data) {
        // var data = [10, 20, 30];
        const orgs = [];
        console.log(data);
        data.sort(
            (a, b) => parseInt(b.num_members) - parseInt(a.num_members)
        );
        const colors = ["green", "purple", "yellow"];

        const num_repos = institution => parseInt(institution.num_repos);
        const members = institution => parseInt(institution.num_members);
        const contributors = i => parseInt(i.total_num_contributors);
        var sector = i => i.sector;

        var yscale = d3
        .scaleLinear()
        .domain([
            d3.min(data.map(num_repos)),
            d3.max(data.map(num_repos))
        ])
        .range([height - padding, padding]);

        var yAxis = d3
        .axisLeft()
        .scale(yscale)
        .ticks(5);

        var xscale = d3
        .scaleLinear()
        .domain([
            d3.min(data.map(contributors)),
            d3.max(data.map(contributors))
        ])
        .range([padding, width - padding]);

        var xAxis = d3
        .axisBottom()
        .scale(xscale)
        .ticks(5);
        // var xscale = d3.scaleBand(data.map(i => i.name), [20, 270]);

        var colorScale = d3.scaleOrdinal(
            _.uniq(data.map(sector)),
            d3.schemePaired
        );

        var sizeScale = d3
        .scaleLinear()
        .domain([
            d3.min(data.map(members)),
            d3.max(data.map(members))
        ])
        .range([4, 30]);

        this.svg = d3
        .select("main")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

        this.text = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", "0");

        const g = svg
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d, i) {
            return "translate(0,0)";
        });

        g.append("circle")

        .attr("cx", function(inst, i) {
            return xscale(contributors(inst));
        })

        .attr("cy", function(inst, i) {
            return yscale(parseInt(inst.num_repos));
        })

        .attr("r", function(inst) {
            return sizeScale(members(inst));
        })

        .attr("svg:title", inst => inst.name)

        .attr("fill", function(inst, i) {
            return colorScale(inst.sector);
        })
        .on("click", inst => {
            window.open("https://github.com/" + orgs[0], "_blank");
        })
        .on("mouseover", inst => {
            var img = eval(inst.avatar)[0];
            text
            .html(
                `<img src="${img}" height=25 ><br>
                ${inst.name}<br>
                Repos: ${inst.num_repos}<br>
                Contributors: ${inst.total_num_contributors}<br>
                Members: ${inst.num_members}`
            )
            .style("display", "block")

            .style(
                "top",
                yscale(parseInt(inst.num_repos)) - sizeScale(members(inst))
            )
            //   .transition()
            //   .duration(200)
            .style("opacity", 0.8);
            if (xscale(contributors(inst)) > width / 2) {
                text
                .style(
                    "right",
                    width -
                        (xscale(contributors(inst)) + sizeScale(members(inst)))
                )
                .style("left", undefined);
            } else {
                text
                .style(
                    "left",
                    xscale(contributors(inst)) + sizeScale(members(inst))
                )
                .style("right", undefined);
            }
        })
        .on("mouseout", inst => {
            text.style("opacity", 0).style("display", "none");
        });

        svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - padding) + ")")
        .call(xAxis);

        svg
        .append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);
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

export function setup(data) {
}

function redraw(data) {
}
