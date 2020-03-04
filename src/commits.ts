import { context, GitHub } from '@actions/github';

/**
 * Generate a Markdown string based on commit information.
 * @param commits - The JSON array with Github commit info.
 */
export async function commitParser(github: GitHub, commitDiffBase: string, releaseTag: string) {
  let commitMd = '';
  const { owner, repo } = context.repo;
  const compareCommitsResponse = await github.repos.compareCommits({
    owner,
    repo,
    base: commitDiffBase,
    head: releaseTag
  });
  const { data: { commits } } = compareCommitsResponse;

  commits.forEach((commit, index) => {
    const { login: username, html_url: authorUrl } = commit.author;
    commitMd = `${commitMd}- [#${index + 1}](${commit.html_url}) ${
      commit.commit.message
    } ([@${username}](${authorUrl}))\n`;
  });
  return commitMd.trim();
}
