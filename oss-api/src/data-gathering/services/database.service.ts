import * as mongoDB from "mongodb";
import { Timestamp } from "mongodb";
import { CrawlerConfig } from "src/data-types";
import rawResponse from "../models/rawResponse";
import todoInstituition from "../models/todoInstitution";

export const dbCollections: { todoInstitution?: mongoDB.Collection, institutions?: mongoDB.Collection, progress?: mongoDB.Collection, repositoriesNew?: mongoDB.Collection, running?: mongoDB.Collection, usersNew?: mongoDB.Collection, rawResponse?: mongoDB.Collection } = {}

/**
 * Connect to the MongoDB Database
 */
export const connectToDatabase = async () => { 
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DATABASELINK);
    await client.connect();
    const db: mongoDB.Db = client.db("statisticsNew");
    dbCollections.todoInstitution = db.collection("todoInstitutions");
    dbCollections.institutions = db.collection("institutions");
    dbCollections.progress = db.collection("progress");
    dbCollections.repositoriesNew = db.collection("repositoriesNew");
    dbCollections.running = db.collection("running");
    dbCollections.usersNew = db.collection("usersNew");
    dbCollections.rawResponse = db.collection("rawResponse");
 }

 /*****************************************READ**************************************************************/

 /**
  * Get all the Institutions that need to be crawled
  * 
  * @returns the todoInstitutions object array;
  */
 export const db_readTodoInstitutions = async () => {
    return (await dbCollections.todoInstitution.find({}).toArray()) as todoInstituition[];
 }
 
 /*****************************************WRITE**************************************************************/

 /**
  * Write the raw response from github to the database
  * @param response The reponse object
  * @param method What exactly was requested
  */
 export const db_writeRawResponse = async (response: object, method: string) => {
    await dbCollections.rawResponse.insertOne({method, response, ts : new Date()})
 }


 /*****************************************DELETE**************************************************************/

 /**
  * Remove all new users from the users new collection
  */
 export const db_removeAllNewUsers = async () => {
    await dbCollections.usersNew.deleteMany({});
 }