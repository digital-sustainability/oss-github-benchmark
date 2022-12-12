import * as mongoDB from "mongodb";
import { CrawlerConfig } from "src/data-types";
import todoInstituition from "../models/todoInstitution";

export const dbCollections: { todoInstitution?: mongoDB.Collection, institutions?: mongoDB.Collection, progress?: mongoDB.Collection, repositoriesNew?: mongoDB.Collection, running?: mongoDB.Collection, usersNew?: mongoDB.Collection } = {}

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
 }

 /**
  * Get all the Institutions that need to be crawled
  * 
  * @returns the todoInstitutions object array;
  */
 export const db_getTodoInstitutions = async () => {
    return (await dbCollections.todoInstitution.find({}).toArray()) as todoInstituition[];
 }