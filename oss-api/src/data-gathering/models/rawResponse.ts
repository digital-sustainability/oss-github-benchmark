import { ObjectId } from "mongodb";

export default class rawResponse {
    constructor(public method: string, public response: object, public ts: Date, public _id: ObjectId){}
}