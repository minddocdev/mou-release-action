import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  createGithubRelease,
  renderReleaseBody,
  createGitTag,
  renderReleaseName,
} from './lib/release';
import { commitParser } from './lib/commits';
import { retrieveLastReleasedVersion, bumpVersion, VersionType } from './lib/version';

export async function run(): Promise<void> {
  try {
    // Global config
    const app = core.getInput('app', { required: false });
    const token = core.getInput('token', { required: true });
    const tagPrefix = app ? `${app}@` : `v`;

    const octokit = github.getOctokit(token);

    // Commit loading config
    const baseTag =
      core.getInput('baseTag', { required: false }) ||
      (await retrieveLastReleasedVersion(octokit, tagPrefix));
    const taskBaseUrl = core.getInput('taskBaseUrl', { required: false });
    const taskPrefix = core.getInput('taskPrefix', { required: false });

    // Release config
    const pushTag = core.getInput('pushTag', { required: false }) === 'true';
    const templatePath = core.getInput('templatePath', { required: true });

    const releaseNotesFilepath = core.getInput('releaseNotesFilepath', { required: false });
    const releaseNotesLanguageTags = core.getInput('releaseNotesLanguageTags', { required: false });

    const draft = core.getInput('draft', { required: false }) === 'true' || false;
    const prerelease = core.getInput('prerelease', { required: false }) === 'true' || false;

    const diffInfo = await commitParser(octokit, baseTag, taskPrefix, taskBaseUrl, app);
    const { changes, tasks, pullRequests } = diffInfo;

    let { nextVersionType } = diffInfo;
    // Force next version as release candidate if prerelease draft is created
    if (prerelease) nextVersionType = VersionType.prerelease;

    const releaseTag =
      core.getInput('releaseTag', { required: false }) ||
      (await bumpVersion(octokit, tagPrefix, nextVersionType, baseTag));
    if (pushTag) await createGitTag(octokit, releaseTag);
    // Won't replace it if release tag is given manually
    const releaseVersion = releaseTag.replace(tagPrefix, '');
    const releaseName =
      core.getInput('releaseName', { required: false }) || renderReleaseName(releaseVersion, app);
    const body = renderReleaseBody(
      templatePath,
      app,
      releaseVersion,
      changes,
      tasks,
      pullRequests,
      releaseNotesFilepath,
      releaseNotesLanguageTags,
    );
    await createGithubRelease(octokit, releaseTag, releaseName, body, draft, prerelease);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    core.setFailed(error.message);
  }
}
