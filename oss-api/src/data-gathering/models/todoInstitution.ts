import { ObjectId } from "mongodb";
import { CrawlerSector, CrawlerConfig } from "src/data-types";

export default class todoInstitution {
    constructor(public githubrepos: Array<Array<CrawlerSector>>, public _id: ObjectId){}
}