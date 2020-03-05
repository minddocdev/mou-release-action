import * as core from '@actions/core';
import { GitHub } from '@actions/github';
import { createGithubRelease, renderReleaseBody } from './release';
import { commitParser } from './commits';

async function run() {
  try {
    // Global config
    const app = core.getInput('app', { required: true });
    const token = core.getInput('token', { required: true });
    // Commit loading config
    const commitDiffBase = core.getInput('commitDiffBase', { required: false });
    const commitScope = core.getInput('commitScope', { required: false });
    const taskBaseUrl = core.getInput('taskBaseUrl', { required: false });
    const taskPrefix = core.getInput('taskPrefix', { required: false });
    // Release config
    const releaseName = core.getInput('releaseName', { required: false });
    const releaseTag = core.getInput('releaseTag', { required: true });
    const templatePath = core.getInput('templatePath', { required: true });
    const draft = core.getInput('draft', { required: false }) == 'true' || true;
    const prerelease =
      core.getInput('prerelease', { required: false }) == 'true' || true;

    const github = new GitHub(token);
    let body = '';
    if (commitDiffBase) {
      const { changes, tasks, pullRequests } = await commitParser(
        github,
        commitDiffBase,
        releaseTag,
        commitScope,
        taskPrefix,
        taskBaseUrl,
      );
      body = renderReleaseBody(templatePath, app, changes, tasks, pullRequests);
    } else {
      body = renderReleaseBody(templatePath, app);
    }
    await createGithubRelease(github, releaseTag, releaseName, body, draft, prerelease);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
