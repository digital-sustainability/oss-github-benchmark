import * as d3 from "d3";
import "../styles/main.scss";
// import {registerManager} from "./visualizationManager";
import { Bubble } from "./visualizations/bubbles";
import {SunBurst} from "./visualizations/sunburst";
import {IState} from "./interfaces/State";

console.log("started");

const dataInfo = {
    dimension1: "total_num_contributors",
    dimension2: "num_repos",
    dimension3: "num_members",
    dimensions: [],
};

// const visualizations = [
//     {
//         id: "viz1",
//         width: 90, // in %
//         height: 600, // in px
//         visualization: Bubble,
//         vOptions: {
//             onClick: repoList
//         }
//     },
//     {
//         id: "viz2",
//         width: 70, // in %
//         height: 600, // in px
//         visualization: Bubble,
//         vOptions: {
//             onClick: repoList
//         }
//     }
// ];

const visualizations = [
    new Bubble(document.getElementById("viz1"), repoList),
    new SunBurst(document.getElementById("viz2"))
]


let state: IState = {
    ...dataInfo,
    jsonData: [],
    csvData: [],
    visualizations
};

registerModal();

// const panelEl = document.getElementById("panel");
// const vizButtonEl = document.getElementById("addVisualization");
// const visualizationManager = registerManager(panelEl, vizButtonEl)

function selectDimension() {
    const dimensions = Object.keys(state.jsonData[0]);
    dimensionSelectElements.forEach((el, i) => {
        state["dimension" + (i + 1)] = dimensions[el.selectedIndex];
    });
    state.visualizations.forEach(v => v.update(state));
}

loadData().then( data => {
    state.csvData = data.csvData;
    state.jsonData = data.jsonData;
    state.visualizations.forEach(v => v.setup(state));
    createDimensionSelection(state);
});


function loadData() {
  return d3.csv("assets/oss-github-benchmark.csv").then((csvData) => {
    return d3.json("assets/oss-github-benchmark.json").then((jsonData) => {
      return {csvData, jsonData};
    });
  });
}

const dimensionSelectElements = [
  document.getElementById("dimension1") as HTMLSelectElement,
  document.getElementById("dimension2") as HTMLSelectElement,
  document.getElementById("dimension3") as HTMLSelectElement,
];

function createDimensionSelection(state) {
    dimensionSelectElements.forEach((el, i) => {
        while (el.firstChild) {
            el.removeChild(el.lastChild);
        }
        const dimensions = Object.keys(state.jsonData[0]);
        dimensions.forEach((dimension) => {
            el.append(new Option(dimension, dimension));
        });
        el.selectedIndex = dimensions.indexOf(
            state["dimension" + (i + 1)]
        );
        el.onchange = selectDimension;
    });
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

function registerModal() {
    // Get the modal
    const modal = document.getElementById("myModal");
    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close")[0] as HTMLElement;
    span.onclick = function () {
        modal.style.display = "none";
    };
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}
