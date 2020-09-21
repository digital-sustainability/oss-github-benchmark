import {IInstitution} from "./Institution";

export interface VisualizationType {
    setup(arg0: IState, arg1: any): void; 
    update(arg0: IState, arg1: any): void; 
}

export interface IState {
    jsonData: IInstitution[];
    csvData: any[];
};
