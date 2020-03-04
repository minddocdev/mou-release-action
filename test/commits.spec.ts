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
const sha = '62ec8ea713fdf14e4abaef3d7d5138194dec49ce';

describe('commit', () => {
  test('render commit diff for each category', async () => {
    const compareCommitsResponse = {
      data: {
        commits: [
          {
            author,
            html_url,
            sha,
            commit: { message: 'feat:super feature' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'fix: My fix' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'docs(context): document everything' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'style: awesome style' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'refactor: one does not simply refactor' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'test(: Tests are good' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'chore: somebody has to keep things going' },
          },
          {
            author,
            html_url,
            sha,
            commit: { message: 'uncategorized commit' },
          },
        ],
      },
    };
    const compareCommits = jest.fn(() => compareCommitsResponse);
    const github = { repos: { compareCommits } };
    expect(await commitParser(github as any, 'v1.0.0', 'v1.1.1')).toMatchSnapshot();
  });
});
