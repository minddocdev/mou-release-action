import { context, GitHub } from '@actions/github';

// Octokit's commit type subset
interface Commit {
  author: {
    login: string,
    html_url: string,
  },
  html_url: string,
  commit: {
    message: string,
  },
  sha: string,
}

const commitGroups: {
  [index: string]: { title: string, commits: Commit[] },
} = {
  feat: {
    title: '**:zap: Features**',
    commits: [],
  },
  fix: {
    title: '**:wrench: Fixes**',
    commits: [],
  },
  docs: {
    title: '**:books: Documentation**',
    commits: [],
  },
  style: {
    title: '**:nail_care: Style changes**',
    commits: [],
  },
  refactor: {
    title: '**:mountain: Refactors**',
    commits: [],
  },
  test: {
    title: '**:traffic_light: Tests**',
    commits: [],
  },
  chore: {
    title: '**:construction: Maintenance**',
    commits: [],
  },
};

const uncategorizedCommits: Commit[] = [];

/**
 * Generate a Markdown string based on commit information.
 * @param commits - The JSON array with Github commit info.
 */
export async function commitParser(github: GitHub, commitDiffBase: string, releaseTag: string) {
  const { owner, repo } = context.repo;
  const compareCommitsResponse = await github.repos.compareCommits({
    owner,
    repo,
    base: commitDiffBase,
    head: releaseTag
  });
  const { data: { commits } } = compareCommitsResponse;

  commits.forEach((commit) => {
    const { message } = commit.commit;

    // Check if commit message matches to any of the defined categories
    let categoryMatch = false;
    Object.keys(commitGroups).some((category) => {
      if (message.startsWith(`${category}:`) || message.startsWith(`${category}(`)) {
        commitGroups[category].commits.push(commit);
        categoryMatch = true;
        return true;
      }
    });
    if (!categoryMatch) uncategorizedCommits.push(commit);
  });

  let commitMd = '';

  const formatCommit = (commit: Commit, stripGroup = false) => {
    const { login: username, html_url: authorUrl } = commit.author;
    let { message } = commit.commit;
    const { sha } = commit;
    if (stripGroup) {
      // Remove group information for changelog
      message = message.split(':')[1].trim();
    }
    // Always capitalize commit messages
    message = `${message[0].toUpperCase()}${message.slice(1)}`;
    commitMd = `${commitMd}- ${message} - [${sha.substring(0, 8)}](${
      commit.html_url
    })([@${username}](${authorUrl}))\n`;
  };

  uncategorizedCommits.forEach((commit) => formatCommit(commit));

  Object.keys(commitGroups).forEach((category) => {
    const { title, commits } = commitGroups[category];
    if (commits.length !== 0) {
      commitMd = `${commitMd}\n${title}\n`;
      commits.forEach(commit => formatCommit(commit, true));
    }
  });

  return commitMd.trim();
}
