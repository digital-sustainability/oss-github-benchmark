import {VisualizationPanel, IVisualizationState} from "./VisualizationPanel";

export function registerManager(panelEl: HTMLElement, buttonEl: HTMLElement) {
    debugger;
    const visualizationManager = new VisualizationManager(panelEl);
    buttonEl.addEventListener("click", visualizationManager.addVisualization)
    return visualizationManager;
}

class VisualizationManager {
    visualizations: VisualizationPanel[];
    idCounter = 0;
    idPrefix = "viz";

    constructor(private panelEl: HTMLElement) {}

    addVisualization = event => {
        const visualization = {
            left: 0,
            top: 0,
            width: 40,
            height: 22,
        }
        let vEl: HTMLElement;

        const startElementCreation = (event: MouseEvent) => {
            debugger;
            visualization.left = event.clientX;
            visualization.top = event.clientY;
            vEl = document.createElement("div");
            vEl.setAttribute("id", this.getIdentifier());
            vEl.setAttribute("class", "viz-container");
            vEl.setAttribute("style", `left: ${visualization.left}px; top: ${visualization.top}px; width: ${visualization.width}px; height: ${visualization.height};`);
            this.panelEl.append(vEl)
            this.panelEl.addEventListener("mousemove", changeDimension)
        }

        function changeDimension(event: MouseEvent) {
            vEl.setAttribute("style", `left: ${visualization.left}px; top: ${visualization.top}px; width: ${visualization.width}px; height: ${visualization.height};`);
        }
        this.panelEl.addEventListener("mousedown", startElementCreation)
        this.panelEl.addEventListener("mouseup", () => {
            this.panelEl.removeEventListener("mousemove", changeDimension)
        })


    }
    
    getIdentifier() {
        const id = this.idPrefix + this.idCounter
        this.idCounter++;
        return id;
    }

    registerVisualizationFromState(visualizationStates: IVisualizationState[]) {
        const newVisualizationStates = visualizationStates.filter( vState => {
            return !this.visualizations.map(v => v.id).includes(vState.id);
        })
        const hangingVisualizationHandler = this.visualizations.filter( v => {
            return !visualizationStates.map(v => v.id).includes(v.id);
        })
        hangingVisualizationHandler.forEach( handler => handler.destroy())
        newVisualizationStates.forEach( def => {
            const id = this.getIdentifier()
            this.visualizations.push(new VisualizationPanel(id));
        })
        visualizationStates.forEach( vState => {
            const v = this.visualizations.filter(v => vState.id === v.id)[0];
            v.mapState(vState);
        })
    }
}
