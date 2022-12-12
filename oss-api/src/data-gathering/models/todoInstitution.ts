import { ObjectId } from "mongodb";

export default class todoInstituition {
    constructor(public githubrepos: Array<Array<Object>>, public _id: ObjectId){}
}