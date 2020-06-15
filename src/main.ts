import * as d3 from "d3";
import "../styles/main.scss";

console.log("started");


( () => {
    // Get the modal
    var modal = document.getElementById("myModal");
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0] as HTMLElement;
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
})()

import {Bubble} from "./visualizations/bubbles";

const initialState = {
    dimension1: 'total_num_contributors',
    dimension2: 'num_repos',
    dimension3: 'num_members'
}
const state: any = initialState;
 
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

let bubble: Bubble;
function setupVisualizations(data) {
   state.dimensions = Object.keys(data[0]);
   createDimensionSelection(data, initialState)
   state.data = data;
   bubble = new Bubble();
   bubble.setup(state);
   bubble.onselect = (institution: any) => {
      repoList(institution);
   };
}

const dimensionSelectElements  = [
    document.getElementById("dimension1") as HTMLSelectElement,
    document.getElementById("dimension2") as HTMLSelectElement,
    document.getElementById("dimension3") as HTMLSelectElement,
];

function createDimensionSelection(data, initialState) {
    dimensionSelectElements.forEach( (el, i) => {
        while (el.firstChild) {
            el.removeChild(el.lastChild);
        }
        state.dimensions.forEach( dimension => {
            el.append(new Option(dimension, dimension));
        })
        el.selectedIndex = state.dimensions.indexOf(initialState["dimension"+(i+1)]);
        el.onchange = selectDimension;
    })
}

function selectDimension() {
    dimensionSelectElements.forEach( (el, i) => {
        state['dimension'+ (i+1)] = state.dimensions[el.selectedIndex];
    });
    bubble.update(state);
}

function repoList(institution) {
    const el = document.getElementById('repoList');
    while (el.firstChild) {
        el.removeChild(el.lastChild);
    }
    const repos = JSON.parse(institution.repo_names.replace(/'/g, '"'));
    const orgs = JSON.parse(institution.orgs.replace(/'/g, '"'));
    repos.forEach( repo => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'https://github.com/' + orgs[0] + '/' + repo;
        a.target = '_blank';
        const content = document.createTextNode(repo)
        a.appendChild(content);
        li.appendChild(a);
        el.append(li);
    })
    
    const modal = document.getElementById("myModal");
    modal.style.display = "block";
}
