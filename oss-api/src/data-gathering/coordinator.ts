import todoInstituition from "./models/todoInstitution";
import { connectToDatabase, dbCollections } from "./services/database.service";
import { connectToGithub } from "./services/github.service";

/**
 * Initate the MongoDB and Github instances
 */
const coordinator = async () => {
    // Connect to database
    await connectToDatabase();
    // Connect to Github
    await connectToGithub();
}


export default coordinator;