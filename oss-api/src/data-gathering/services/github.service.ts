const { Octokit } = require("@octokit/rest");

let octokit;

export const connectToGithub = async () =>{
    octokit = new Octokit();

   /* await octokit.rest.repos
  .listForOrg({
    org: "octokit",
    type: "public",
  })
  .then(({ data }) => {
    console.log(data);
    
  });*/
}