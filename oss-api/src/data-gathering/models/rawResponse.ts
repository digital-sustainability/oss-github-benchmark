import { ObjectId, Timestamp } from "mongodb";

export default class rawResponse {
    constructor(public method: string, public response: JSON, public ts: Date, public _id: ObjectId){}
}