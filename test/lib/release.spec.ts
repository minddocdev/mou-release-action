/* eslint-disable @typescript-eslint/camelcase */
import * as fs from 'fs';
import { setOutput } from '@actions/core';

import {
  createGithubRelease, renderReleaseBody
} from '@minddocdev/mou-release-action/lib/release';

jest.mock('fs');
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'myorg',
      repo: 'myrepo',
    },
  }
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
  describe('render release template', () => {
    const app = 'myapp';
    const templatePath = 'myTemplatePath.md';

    afterEach(() => {
      expect(fs.readFileSync).toBeCalledWith(
        `/home/runner/work/myrepo/myrepo/.github/${templatePath}`,
        'utf8',
      );
    });

  test('render release template', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(
      () => `
# $APP release

Just a template
`,
    );
    expect(renderReleaseBody('myTemplatePath.md', app)).toBe(`
# myapp release

Just a template
`);
  });

  test('render release template with changes, tasks and pull requests', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(
      () => `
# $APP release

## Changelog

$CHANGES

## JIRA

$TASKS

## PRs

$PULL_REQUESTS

## Checklist

- [ ] Check 1
  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
`,
    );
    const changes = `
- [#1](https://commiturl) First commit message ([@darioblanco](https://github.com/darioblanco))
- [#2](https://commiturl) Second commit message ([@darioblanco](https://github.com/darioblanco))
    `;
    const tasks = `
- [JIRA-123](https://myorg.atlassian.net/browse/JIRA-123)
- [JIRA-456](https://myorg.atlassian.net/browse/JIRA-456)
    `;
    const pullRequests = `
- [#1716](https://github.com/myorg/myrepo/pull/1716)
- [#1717](https://github.com/myorg/myrepo/pull/1716)
    `;
    expect(renderReleaseBody('myTemplatePath.md', app, changes, tasks, pullRequests)).toBe(`
# myapp release

## Changelog

${changes}

## JIRA

${tasks}

## PRs

${pullRequests}

## Checklist

- [ ] Check 1
  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
`);
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
    expect(setOutput).toBeCalledWith('id', 'releaseId');
    expect(setOutput).toBeCalledWith('html_url', 'htmlUrl');
    expect(setOutput).toBeCalledWith('upload_url', 'uploadUrl');
  });
});
