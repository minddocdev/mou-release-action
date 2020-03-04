/* eslint-disable @typescript-eslint/camelcase */
import * as fs from 'fs';
import { setOutput } from '@actions/core';

import { createGithubRelease } from '@minddocdev/mou-release-action/release';

jest.mock('fs');
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'theowner',
      repo: 'therepo',
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
  test('render release template', async () => {
    const createRelease = jest.fn(() => createReleaseResponse);
    const github = { repos: { createRelease } };
    (fs.readFileSync as jest.Mock).mockImplementation(
      () => `
# $APP release

## Changelog

$CHANGES

## Checklist

- [ ] Check 1
  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
`,
    );
    const tag = 'v1.1.0';
    const releaseName = 'release title';
    const changes = `
- [#1](https://commiturl) First commit message ([@darioblanco](https://github.com/darioblanco))
- [#2](https://commiturl) Second commit message ([@darioblanco](https://github.com/darioblanco))
    `;
    const draft = true;
    const prerelease = true;
    await createGithubRelease(
      github as any, 'templatePath.md', tag, releaseName, draft, prerelease, 'myapp', changes,
    );

    expect(createRelease).toBeCalledWith({
      draft,
      prerelease,
      owner: 'theowner',
      repo: 'therepo',
      tag_name: tag,
      name: releaseName,
      body: `
# myapp release

## Changelog

${changes}

## Checklist

- [ ] Check 1
  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
`
    });
    expect(setOutput).toBeCalledTimes(3);
    expect(setOutput).toBeCalledWith('id', 'releaseId');
    expect(setOutput).toBeCalledWith('html_url', 'htmlUrl');
    expect(setOutput).toBeCalledWith('upload_url', 'uploadUrl');
  });
});
