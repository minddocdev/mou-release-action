/* eslint-disable @typescript-eslint/camelcase */
import { commitParser } from '@minddocdev/mou-release-action/commits';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'theowner',
      repo: 'therepo',
    },
  },
}));

const author = {
  login: 'darioblanco',
  html_url: 'https://authorurl',
};

const html_url = 'https://commiturl';

const compareCommitsResponse = {
  data: {
    commits: [
      {
        author,
        html_url,
        commit: { message: 'Message 1' },
      },
      {
        author,
        html_url,
        commit: { message: 'Message 2' },
      },
    ],
  },
};

describe('commit', () => {
  test('render commit diff', async () => {
    const compareCommits = jest.fn(() => compareCommitsResponse);
    const github = { repos: { compareCommits } };
    expect(await commitParser(github as any, 'v1.0.0', 'v1.1.1')).toBe(
      '- [#1](https://commiturl) Message 1 ([@darioblanco](https://authorurl))\n\
- [#2](https://commiturl) Message 2 ([@darioblanco](https://authorurl))',
    );
  });
});
