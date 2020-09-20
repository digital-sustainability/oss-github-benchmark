import {VisualizationType} from "./interfaces/VisualizationType";

export class VisualizationPanel {
    private element: HTMLElement;
    visualization: VisualizationType

    constructor(
        public id: string,
        private width = 10,
        private height = 10
    ) {
        this.element = document.createElement("div");
        this.element.setAttribute("id", this.id);
        this.element.setAttribute("class", "viz-panel");
    }

    mapState(state) {
        this.width = state.width;
        this.height = state.height;
        this.visualization = state.visualization;
        this.visualization.mapState(state.vOptions);
    }

    render() {
        this.element.setAttribute("style", `width: ${this.width}%; height: ${this.height}%;`);
    }

    destroy() {
        this.element.remove()
    }
}

export interface IVisualizationState {
    id: string;
    width: number;
    height: number;
    visualization: any;
    vOptions: any;
}
