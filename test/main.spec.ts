import * as core from '@actions/core';

import {
  retrieveLastReleasedVersion,
  bumpVersion,
  VersionType,
} from '@minddocdev/mou-release-action/lib/version';
import { run } from '@minddocdev/mou-release-action/main';
import {
  createGitTag,
  createGithubRelease,
  renderReleaseBody,
  renderReleaseName,
} from '@minddocdev/mou-release-action/lib/release';
import { commitParser } from '@minddocdev/mou-release-action/lib/commits';

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(() => () => {}),
}));
jest.mock('@actions/core');
jest.mock('@minddocdev/mou-release-action/lib/commits');
jest.mock('@minddocdev/mou-release-action/lib/release');
jest.mock('@minddocdev/mou-release-action/lib/version');

describe('run', () => {
  // Required input values
  const templatePath = 'RELEASE_DRAFT/default.md';
  const token = 'faketoken';
  // Default input values
  const taskPrefix = 'JIRA-';
  const draft = true;
  const prerelease = true;
  // Template stubs
  const changes = '';
  const nextVersionType = VersionType.patch;
  const tasks = '';
  const pullRequests = '';
  const body = 'releaseBody';
  // Release Notes
  const releaseNotes = true;
  const releaseNotesPath = 'releaseNotesPath';
  const releaseNotesCountryCodes = 'releaseNotesCountryCodes';
  const releaseNotesFilename = 'releaseNotesFilename';

  beforeEach(() => {
    (commitParser as jest.Mock).mockImplementation(() => ({
      changes,
      nextVersionType,
      tasks,
      pullRequests,
    }));
    (renderReleaseBody as jest.Mock).mockImplementation(() => body);
  });

  test('with required params', async () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      switch (name) {
        case 'bumpProtection':
          return 'false';
        case 'draft':
          return String(draft);
        case 'prerelease':
          return String(prerelease);
        case 'pushTag':
          return 'false';
        case 'taskPrefix':
          return taskPrefix;
        case 'templatePath':
          return templatePath;
        case 'token':
          return token;
        case 'releaseNotes':
          return 'true';
        case 'releaseNotesPath':
          return 'releaseNotesPath';
        case 'releaseNotesCountryCodes':
          return 'releaseNotesCountryCodes';
        case 'releaseNotesFilename':
          return 'releaseNotesFilename';
        default:
          return undefined;
      }
    });
    const tagPrefix = 'v';

    const baseTag = 'v1.0.0';
    (retrieveLastReleasedVersion as jest.Mock).mockImplementation(() => baseTag);

    const releaseName = `draft prerelease`;
    (renderReleaseName as jest.Mock).mockImplementation(() => releaseName);
    const releaseVersion = '1.0.5';
    const releaseTag = `${tagPrefix}${releaseVersion}`;
    (bumpVersion as jest.Mock).mockImplementation(() => releaseTag);

    await run();

    expect(retrieveLastReleasedVersion).toBeCalledWith(expect.any(Function), tagPrefix);
    expect(commitParser).toBeCalledWith(
      expect.any(Function),
      baseTag,
      taskPrefix,
      undefined,
      undefined,
    );
    expect(renderReleaseName).toBeCalledWith(releaseVersion, undefined);
    expect(renderReleaseBody).toBeCalledWith(
      templatePath,
      undefined,
      releaseVersion,
      changes,
      tasks,
      pullRequests,
      releaseNotes,
      releaseNotesPath,
      releaseNotesCountryCodes,
      releaseNotesFilename,
    );
    expect(bumpVersion).toBeCalledWith(
      expect.any(Function),
      tagPrefix,
      VersionType.prerelease,
      baseTag,
    );
    expect(createGitTag).not.toBeCalled();
    expect(createGithubRelease).toBeCalledWith(
      expect.any(Function),
      releaseTag,
      releaseName,
      body,
      draft,
      prerelease,
    );
    expect(core.setFailed).not.toBeCalled();
  });

  test('with specific production release and new release tag', async () => {
    const app = 'fake-app';
    const baseTag = 'v1.0.4';
    const givenDraft = false;
    const givenPrerelease = false;
    const releaseName = 'fake-app';
    const releaseTag = `mycustomprefix-1.0.6`;
    const taskBaseUrl = 'https://myfaketask.url';
    // Release Notes
    const releaseNotes = true;
    const releaseNotesPath = 'releaseNotesPath';
    const releaseNotesCountryCodes = 'releaseNotesCountryCodes';
    const releaseNotesFilename = 'releaseNotesFilename';

    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      switch (name) {
        case 'app':
          return app;
        case 'baseTag':
          return baseTag;
        case 'bumpProtection':
          return 'true';
        case 'draft':
          return String(givenDraft);
        case 'monorepo':
          return 'true';
        case 'prerelease':
          return String(givenPrerelease);
        case 'pushTag':
          return 'true';
        case 'releaseName':
          return releaseName;
        case 'releaseTag':
          return releaseTag;
        case 'taskBaseUrl':
          return taskBaseUrl;
        case 'taskPrefix':
          return taskPrefix;
        case 'templatePath':
          return templatePath;
        case 'token':
          return token;
        case 'releaseNotes':
          return 'true';
        case 'releaseNotesPath':
          return 'releaseNotesPath';
        case 'releaseNotesCountryCodes':
          return 'releaseNotesCountryCodes';
        case 'releaseNotesFilename':
          return 'releaseNotesFilename';
        default:
          return undefined;
      }
    });

    await run();

    expect(retrieveLastReleasedVersion).not.toBeCalled();
    expect(commitParser).toBeCalledWith(
      expect.any(Function),
      baseTag,
      taskPrefix,
      taskBaseUrl,
      app,
    );
    expect(renderReleaseBody).toBeCalledWith(
      templatePath,
      app,
      releaseTag,
      changes,
      tasks,
      pullRequests,
      releaseNotes,
      releaseNotesPath,
      releaseNotesCountryCodes,
      releaseNotesFilename,
    );
    expect(renderReleaseBody).toBeCalledWith(
      templatePath,
      app,
      releaseTag,
      changes,
      tasks,
      pullRequests,
      releaseNotes,
      releaseNotesPath,
      releaseNotesCountryCodes,
      releaseNotesFilename,
    );
    expect(bumpVersion).not.toBeCalled();
    expect(createGitTag).toBeCalledWith(expect.any(Function), releaseTag);
    expect(createGithubRelease).toBeCalledWith(
      expect.any(Function),
      releaseTag,
      releaseName,
      body,
      givenDraft,
      givenPrerelease,
    );
    expect(core.setFailed).not.toBeCalled();
  });

  test('unexpected error', async () => {
    const errorMsg = 'fake';
    (core.getInput as jest.Mock).mockImplementation(() => {
      throw new Error(errorMsg);
    });

    await run();
    expect(core.setFailed).toBeCalledWith(errorMsg);
  });
});
