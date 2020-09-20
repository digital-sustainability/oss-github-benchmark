import {IInstitution} from "./Institution";

export interface VisualizationType {
    setup(arg0: IState): void; 
    update(arg0: IState): void; 
    mapState(arg0: any): void;
}

export interface IState {
    jsonData: IInstitution[];
    data: any[];
};
