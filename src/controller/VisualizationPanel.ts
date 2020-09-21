import {VisualizationType} from "./interfaces/VisualizationType";

export class VisualizationPanel {
    public element: HTMLElement;
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

    update(state, vState) {
        this.width = vState.width;
        this.height = vState.height;
        this.render();
        this.visualization.update(state, vState.vOptions);
    }

    render() {
        this.element.setAttribute("style", `width: ${this.width}%; height: ${this.height}px;`);
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
