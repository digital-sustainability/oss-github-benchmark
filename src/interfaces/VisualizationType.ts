import {IInstitution} from "./Institution";

export interface VisualizationType {
    setup(arg0: IState): void; 
    update(arg0: IState): void; 
}

export interface IState {
    jsonData: IInstitution[];
    csvData: any[];
};
