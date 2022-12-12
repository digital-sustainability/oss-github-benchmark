import * as mongoDB from "mongodb";

export const dbCollections: { todoInstitution?: mongoDB.Collection, institutions?: mongoDB.Collection, progress?: mongoDB.Collection, repositoriesNew?: mongoDB.Collection, running?: mongoDB.Collection, usersNew?: mongoDB.Collection } = {}

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