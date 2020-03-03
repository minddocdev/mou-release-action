import * as core from '@actions/core';
import {generateReleaseBody} from './template';
import {createRelease} from './release';

export interface CommitAuthor {
  email: string;
  name: string;
  username: string;
}

export interface Commit {
  author: CommitAuthor;
  committer: CommitAuthor;
  distinct: boolean;
  id: string;
  message: string;
  timestamp: string;
  tree_id: string;
  url: string;
}

function getJSON(rawJSON: string): {} {
  core.debug(`Parsing raw JSON ${rawJSON}`);
  let json: {};
  try {
    json = JSON.parse(rawJSON);
    core.debug(`Loaded JSON: ${JSON.stringify(json)}`);
  } catch (err) {
    throw new Error(`Unable to parse variables. Found content: ${rawJSON}`);
  }
  return json;
}

async function run() {
  try {
    const app = core.getInput('app', {required: true});
    const rawCommits = core.getInput('commits', {required: false});
    const commits = rawCommits ? (getJSON(rawCommits) as Commit[]) : [];
    const tag = core.getInput('tag', {required: true});
    const templatePath = core.getInput('template', {required: true});
    const token = core.getInput('token', {required: true});
    const draft = core.getInput('draft', {required: false}) == 'true' || true;
    const prerelease =
      core.getInput('prerelease', {required: false}) == 'true' || true;

    const releaseName =
      core.getInput('releaseName', {required: false}) || `[${app}] ${{tag}}`;
    const body = generateReleaseBody(templatePath, app, commits);
    await createRelease(token, tag, releaseName, body, draft, prerelease);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
