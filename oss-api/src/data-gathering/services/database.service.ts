import * as mongoDB from 'mongodb';
import { Institution } from 'src/data-types';
import { Repository, User } from 'src/interfaces';
import institution from '../models/institution';
import todoInstituition from '../models/todoInstitution';
import user from '../models/user';

export const dbCollections: {
  todoInstitution?: mongoDB.Collection;
  institutions?: mongoDB.Collection;
  progress?: mongoDB.Collection;
  repositoriesNew?: mongoDB.Collection;
  running?: mongoDB.Collection;
  usersNew?: mongoDB.Collection;
  rawResponse?: mongoDB.Collection;
} = {};

/**
 * Connect to the MongoDB Database
 */
export const connectToDatabase = async () => {
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.DATABASELINK,
  );
  await client.connect();
  const db: mongoDB.Db = client.db('testing');
  dbCollections.todoInstitution = db.collection('todoInstitutions');
  dbCollections.institutions = db.collection('institutions');
  dbCollections.progress = db.collection('progress');
  dbCollections.repositoriesNew = db.collection('repositoriesNew');
  dbCollections.running = db.collection('running');
  dbCollections.usersNew = db.collection('usersNew');
  dbCollections.rawResponse = db.collection('rawResponse');
};

/*****************************************READ**************************************************************/

/**
 * Get all the Institutions that need to be crawled
 *
 * @returns the todoInstitutions object array;
 */
export const db_readTodoInstitutions = async () => {
  return (await dbCollections.todoInstitution
    .find({})
    .toArray()) as todoInstituition[];
};

/**
 * Get a Institution with its uuid
 * @param uuid The uuid of the institution
 * @returns The Institution as an institution objetc
 */
export const db_readInstitution = async (uuid: string) => {
  return (await dbCollections.institutions.findOne({
    uuid: uuid,
  })) as institution;
};

/**
 * Get a User with its login
 * @param login The login of the user
 * @returns The user as a user object
 */
export const db_getUser = async (login: string) => {
  return (await dbCollections.usersNew.findOne({ login: login })) as user;
};

/*****************************************Create**************************************************************/

/**
 * Write the raw response from github to the database
 * @param response The reponse object
 * @param method What exactly was requested
 */
export const db_createRawResponse = async (
  response: object,
  method: string,
  institutionName: string,
  orgName?: string,
  repoName?: string,
) => {
  await dbCollections.rawResponse.insertOne({
    method,
    response,
    ts: new Date(),
    institutionName,
    orgName,
    repoName,
  });
};

/**
 * Insert a repository into the database
 * @param repository The repository to be inserted
 */
export const db_createRepository = async (repository: Repository) => {
  await dbCollections.repositoriesNew.insertOne(repository);
};

/**
 * Insert a user into the database
 * @param user The user object
 */
export const db_createUser = async (user: User) => {
  await dbCollections.usersNew.insertOne(user);
};

/*****************************************Update**************************************************************/

/**
 * Update user in database
 * @param user The user object
 */
export const db_UpdateUser = async (user: User) => {
  await dbCollections.usersNew.updateOne({ login: user.login }, { $set: user });
};

export const db_Update_Create_Institution = async (
  institution: Institution,
) => {
  await dbCollections.institutions.replaceOne(
    { uuid: institution },
    { institution },
    { upsert: true },
  );
};

/*****************************************DELETE**************************************************************/

/**
 * Remove all new users from the users new collection
 */
export const db_removeAllNewUsers = async () => {
  await dbCollections.usersNew.deleteMany({});
};
