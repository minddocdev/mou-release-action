import * as core from '@actions/core';
import { GitHub } from '@actions/github';
import { createGithubRelease } from './release';
import { commitParser } from './commits';

async function run() {
  try {
    const app = core.getInput('app', { required: true });
    const commitDiffBase = core.getInput('commitDiffBase', { required: false });
    const releaseName = core.getInput('releaseName', { required: false });
    const releaseTag = core.getInput('releaseTag', { required: true });
    const templatePath = core.getInput('templatePath', { required: true });
    const token = core.getInput('token', { required: true });
    const draft = core.getInput('draft', { required: false }) == 'true' || true;
    const prerelease =
      core.getInput('prerelease', { required: false }) == 'true' || true;

    const github = new GitHub(token);
    let changes = '';
    if (commitDiffBase) changes = await commitParser(github, commitDiffBase, releaseTag);
    await createGithubRelease(
      github,
      templatePath,
      releaseTag,
      releaseName,
      draft,
      prerelease,
      app,
      changes,
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
