import { resolve as pathResolve } from 'path';
import { setOutput } from '@actions/core';

import {
  createGithubRelease,
  renderReleaseBody,
  createGitTag,
  renderReleaseName,
} from '@minddocdev/mou-release-action/lib/release';

jest.mock('path');
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'myorg',
      repo: 'myrepo',
    },
    sha: 'mysha',
  },
}));
jest.mock('@actions/core');

const createReleaseResponse = {
  data: {
    id: 'releaseId',
    html_url: 'htmlUrl',
    upload_url: 'uploadUrl',
  },
};

describe('release', () => {
  describe('render release name', () => {
    test('without app', () => {
      expect(renderReleaseName('0.0.1')).toBe('0.0.1');
    });
    test('with app', () => {
      expect(renderReleaseName('0.0.1', 'myapp')).toBe('myapp@0.0.1');
    });
  });

  describe('render release template', () => {
    const app = 'myapp';
    const releaseVersion = '1.0.0';
    const templatePath = 'myTemplatePath.md';

    test('render release template', () => {
      (pathResolve as jest.Mock).mockImplementation(() => `${__dirname}/fixtures/basic.md`);
      expect(renderReleaseBody('myTemplatePath.md', app, releaseVersion)).toMatchSnapshot();
      expect(pathResolve).toBeCalledWith(
        '/home/runner/work',
        'myrepo',
        'myrepo',
        '.github',
        templatePath,
      );
    });

    test('render release template with changes, tasks and pull requests', () => {
      (pathResolve as jest.Mock).mockImplementation(
        () => `${__dirname}/fixtures/with-changelog.md`,
      );

      const changes =
        '' +
        '- [#1](https://commiturl) First commit message ' +
        '([@darioblanco](https://github.com/darioblanco))\n' +
        '- [#2](https://commiturl) Second commit message ' +
        '([@darioblanco](https://github.com/darioblanco))';
      const tasks =
        '' +
        '- [JIRA-123](https://myorg.atlassian.net/browse/JIRA-123)\n' +
        '- [JIRA-456](https://myorg.atlassian.net/browse/JIRA-456)';
      const pullRequests =
        '' +
        '- [#1716](https://github.com/myorg/myrepo/pull/1716)\n' +
        '- [#1717](https://github.com/myorg/myrepo/pull/1717)';
      expect(
        renderReleaseBody('myTemplatePath.md', app, releaseVersion, changes, tasks, pullRequests),
      ).toMatchSnapshot();
      expect(pathResolve).toBeCalledWith(
        '/home/runner/work',
        'myrepo',
        'myrepo',
        '.github',
        templatePath,
      );
    });
    test('render release template with changes, tasks, pull requests and release notes', () => {
      (pathResolve as jest.Mock).mockImplementation(
        () => `${__dirname}/fixtures/with-release-notes.md`,
      );

      const changes =
        '' +
        '- [#1](https://commiturl) First commit message ' +
        '([@darioblanco](https://github.com/darioblanco))\n' +
        '- [#2](https://commiturl) Second commit message ' +
        '([@darioblanco](https://github.com/darioblanco))';
      const tasks =
        '' +
        '- [JIRA-123](https://myorg.atlassian.net/browse/JIRA-123)\n' +
        '- [JIRA-456](https://myorg.atlassian.net/browse/JIRA-456)';
      const pullRequests =
        '' +
        '- [#1716](https://github.com/myorg/myrepo/pull/1716)\n' +
        '- [#1717](https://github.com/myorg/myrepo/pull/1717)';
      expect(
        renderReleaseBody(
          'myTemplatePath.md',
          app,
          releaseVersion,
          changes,
          tasks,
          pullRequests,
          `${__dirname}/fixtures/release-notes/{LANGUAGE_TAG}/release_notes.txt`,
          'de-DE, en-GB',
        ),
      ).toMatchSnapshot();
      expect(pathResolve).toBeCalledWith(
        '/home/runner/work',
        'myrepo',
        'myrepo',
        '.github',
        templatePath,
      );
    });
  });

  describe('create git tag', () => {
    const tag = 'v1.1.0';

    test('returns 201', async () => {
      const createRef = jest.fn(() => ({ status: 201 }));
      const github = { git: { createRef } };
      await createGitTag(github as any, tag);

      expect(createRef).toBeCalledWith({
        owner: 'myorg',
        repo: 'myrepo',
        sha: 'mysha',
        ref: `refs/tags/${tag}`,
      });
    });

    test('returns 404', async () => {
      const status = 404;
      const createRef = jest.fn(() => ({ status }));
      const github = { git: { createRef } };
      await expect(createGitTag(github as any, tag)).rejects.toThrowError(
        new Error(`Unable to create tag ${tag}. Github returned status: ${status}`),
      );
    });
  });

  test('create github release', async () => {
    const createRelease = jest.fn(() => createReleaseResponse);
    const github = { repos: { createRelease } };
    const tag = 'v1.1.0';
    const name = 'release title';
    const body = 'my release body';
    const draft = true;
    const prerelease = true;
    await createGithubRelease(github as any, tag, name, body, draft, prerelease);

    expect(createRelease).toBeCalledWith({
      body,
      draft,
      name,
      prerelease,
      owner: 'myorg',
      repo: 'myrepo',
      tag_name: tag,
    });
    expect(setOutput).toBeCalledTimes(3);
    expect(setOutput).toBeCalledWith('release_id', 'releaseId');
    expect(setOutput).toBeCalledWith('html_url', 'htmlUrl');
    expect(setOutput).toBeCalledWith('upload_url', 'uploadUrl');
  });
});
