import * as core from '@actions/core';
import { GitHub } from '@actions/github';

import { createGithubRelease, renderReleaseBody } from './lib/release';
import { commitParser } from './lib/commits';
import { retrieveLastReleasedVersion, bumpVersion } from './lib/version';

export async function run() {
  try {
    // Global config
    const app = core.getInput('app', { required: true });
    const token = core.getInput('token', { required: true });
    const monorepo = core.getInput('monorepo', { required: false }) === 'true';
    const tagPrefix = monorepo ? `${app}@` : `v`;

    const github = new GitHub(token);

    // Commit loading config
    const baseRef =
      core.getInput('baseRef', { required: false }) ||
      (await retrieveLastReleasedVersion(github, tagPrefix));
    const taskBaseUrl = core.getInput('taskBaseUrl', { required: false });
    const taskPrefix = core.getInput('taskPrefix', { required: false });

    // Release config
    const releaseName = core.getInput('releaseName', { required: false });
    const templatePath = core.getInput('templatePath', { required: true });
    const draft = core.getInput('draft', { required: false }) == 'true' || false;
    const prerelease =
      core.getInput('prerelease', { required: false }) == 'true' || false;

    const { changes, nextVersionType, tasks, pullRequests } = await commitParser(
      github,
      baseRef,
      taskPrefix,
      taskBaseUrl,
      monorepo ? app : undefined,
    );
    const body = renderReleaseBody(templatePath, app, changes, tasks, pullRequests);

    const releaseTag = core.getInput('releaseTag', { required: false }) ||
      bumpVersion(token, tagPrefix, nextVersionType);
    await createGithubRelease(github, releaseTag, releaseName, body, draft, prerelease);
  } catch (error) {
    core.setFailed(error.message);
  }
}
