import * as d3 from "d3";
import "../styles/main.scss";

console.log("started");

import {Bubble} from "./visualizations/bubbles";

const initialState = {
    dimension1: 'total_num_contributors',
    dimension2: 'num_repos',
    dimension3: 'num_members'
}
 
loadData();

function loadData() {
    var institutions = [];
    d3.csv("assets/oss-github-benchmark.csv", data => {
        institutions.push(data);
    }).then(() => {
        setupVisualizations(institutions)
    })
}


function redraw() {
}

function setupVisualizations(data) {
   createDimensionSelection(data, initialState)
   Bubble.setup(data);
}

function createDimensionSelection(data, initialState) {
    const dimensions = Object.keys(data[0]);
    const dimensionSelectElements  = [
        document.getElementById("dimension1") as HTMLSelectElement,
        document.getElementById("dimension2") as HTMLSelectElement,
        document.getElementById("dimension3") as HTMLSelectElement,
    ];
    dimensionSelectElements.forEach( (el, i) => {
        while (el.firstChild) {
            el.removeChild(el.lastChild);
        }
        dimensions.forEach( dimension => {
            el.append(new Option(dimension, dimension));
        })
        el.selectedIndex = dimensions.indexOf(initialState["dimension"+(i+1)]);
    })
    
}
