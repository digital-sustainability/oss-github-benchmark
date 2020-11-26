import {IInstitution} from "./Institution";
import {VisualizationType} from "./VisualizationType";

export interface IState {
    dimensions: string[];
    dimension1: string;
    dimension2: string;
    dimension3: string;
    jsonData: IInstitution[];
    csvData: any[];
    visualizations: VisualizationType[];
}
