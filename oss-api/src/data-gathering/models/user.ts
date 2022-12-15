import { ObjectId } from "mongodb";
import { Contributions } from "src/interfaces";

export default class user {
    constructor(
        public _id: ObjectId,
        public login: string,
        public name: string,
        public avatar_url: string,
        public bio: string | null,
        public blog: string,
        public company: string,
        public email: string | null,
        public twitter_username: string | null,
        public location: string,
        public created_at: Date,
        public updated_at: Date,
        public contributions: Contributions,
        public public_repos: number,
        public public_gists: number,
        public followers: number,
        public following: number,
        public orgs: string[],
        ){}
}