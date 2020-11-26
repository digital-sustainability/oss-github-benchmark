import {IState} from "./State";

export interface VisualizationType {
    setup(arg0: IState): void; 
    update(arg0: IState): void; 
}

