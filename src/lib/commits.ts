import { context, GitHub } from '@actions/github';
import * as core from '@actions/core';

import { VersionType } from './version';

// Octokit's commit type subset
interface Commit {
  username: string,
  userUrl: string
  commitUrl: string,
  message: string,
  sha: string,
}

/**
 * Generate a Markdown string based on commit information.
 * @param commits - The JSON array with Github commit info.
 */
export async function commitParser(
  github: GitHub,
  baseRef: string,
  taskPrefix: string,
  taskBaseUrl?: string,
  commitScope?: string,
) {
  const commitGroups: {
    [index: string]: { title: string; commits: Commit[] };
  } = {
    // A new feature
    feat: {
      title: '**:zap: Features**',
      commits: [],
    },
    // A bug fix
    fix: {
      title: '**:wrench: Fixes**',
      commits: [],
    },
    // A code change that improves performance
    perf: {
      title: '**:runner: Performance**',
      commits: [],
    },
    // Documentation only changes
    docs: {
      title: '**:books: Documentation**',
      commits: [],
    },
    // Changes that do not affect the meaning of the code (lint changes)
    style: {
      title: '**:nail_care: Style**',
      commits: [],
    },
    // A code change that neither fixes a bug nor adds a feature
    refactor: {
      title: '**:mountain: Refactors**',
      commits: [],
    },
    // Adding missing tests or correcting existing tests
    test: {
      title: '**:traffic_light: Tests**',
      commits: [],
    },
    // Changes that affect the build system or external development dependencies
    chore: {
      title: '**:construction: Maintenance**',
      commits: [],
    },
    // As an alternative to 'chore', but with very similar meaning
    build: {
      title: '**:construction_worker: Build**',
      commits: [],
    },
    // Changes for CI configuration files and scripts (e.g. Github CI, helm values...)
    ci: {
      title: '**:runner: CI**',
      commits: [],
    },
  };
  const uncategorizedCommits: Commit[] = [];

  const changes: string[] = [];
  const tasks: string[] = [];
  const pullRequests: string[] = [];

  const { owner, repo } = context.repo;
  const compareCommitsResponse = await github.repos.compareCommits({
    owner,
    repo,
    base: baseRef,
    head: context.sha,
  });
  const {
    data: { commits },
  } = compareCommitsResponse;

  const categorizeCommit = (commit: Commit) => {
    const { message } = commit;
    // Skip if scope check is required and commit does not have it
    if (commitScope && !message.includes(`(${commitScope}):`)) {
      return;
    }
    // Check if commit message matches to any of the defined categories
    let categoryMatch = false;
    Object.keys(commitGroups).some(category => {
      // Match with or without scope
      if (message.startsWith(`${category}:`) || message.startsWith(`${category}(`)) {
        commitGroups[category].commits.push(commit);
        categoryMatch = true;
        return true;
      }
    });
    if (!categoryMatch) uncategorizedCommits.push(commit);
  };

  const prRegExp = new RegExp('(\\(#\\d+\\))', 'gi');
  const taskRegExp = new RegExp(`(${taskPrefix}\\d+)`, 'gi');
  commits.forEach(githubCommit => {
    const {
      author: { login: username, html_url: userUrl },
      html_url: commitUrl,
      commit: { message },
      sha,
    } = githubCommit;
    const commit: Commit = { username, userUrl, commitUrl, message, sha };

    // Detect if commit is a Github squash. In that case, ignore commit title and convert
    // in multiple single line commits
    if (/\* .*\n/.test(message)) {
      const messageLines = message.split('* ');
      // Retrieve PR link and JIRA information from first line
      const prMatch = prRegExp.exec(messageLines[0]);
      if (prMatch)
        prMatch.slice(1).forEach(pr => pullRequests.push(pr.replace(/(\(|\)|#)/g, '')));
      const taskMatch = taskRegExp.exec(messageLines[0]);
      if (taskMatch) taskMatch.slice(1).forEach(task => tasks.push(task));
      // Categorize all commits except first one
      messageLines
        .slice(1)
        .forEach(messageLine =>
          categorizeCommit({
            username,
            userUrl,
            commitUrl,
            sha,
            message: messageLine.trim(),
          }),
        );
    } else {
      categorizeCommit(commit);
    }
  });

  let changesMd = '';

  const formatCommit = (commit: Commit) => {
    const { username, userUrl, sha, commitUrl } = commit;
    let { message } = commit;
    // Only take into account the commit title
    message = message.split('\n')[0];
    // Detect if commit message has Angular format
    if (/(\w+\(\w+\)|\w+|\(\w+\)):/.test(message)) {
      // Remove group information for changelog (e.g. messages with categories)
      message = message.split(':')[1].trim();
    }
    // Always capitalize commit messages
    message = `${message[0].toUpperCase()}${message.slice(1)}`;
    // Add to global change markdown
    changesMd = `${changesMd}- ${message} - [${sha.substring(
      0,
      8,
    )}](${commitUrl})([@${username}](${userUrl}))\n`;
    // Add to global commit sha list
    changes.push(sha);
  };

  uncategorizedCommits.forEach(formatCommit);

  Object.keys(commitGroups).forEach(category => {
    const { title, commits } = commitGroups[category];
    if (commits.length !== 0) {
      changesMd = `${changesMd}\n${title}\n`;
      commits.forEach(formatCommit);
    }
  });

  core.setOutput('changes', JSON.stringify(changes));
  core.setOutput('tasks', JSON.stringify(tasks));
  core.setOutput('pull_requests', JSON.stringify(pullRequests));

  return {
    changes: changesMd.trim(),
    nextVersionType: VersionType.patch, // TODO - Detect major and minor from commits or PRs
    tasks: tasks
      .map(
        task =>
          `- [${task}](${
            taskBaseUrl ? taskBaseUrl : `https://${owner}.atlassian.net/browse`
          }/${task})\n`,
      )
      .join(),
    pullRequests: pullRequests
      .map(pr => `- [#${pr}](https://github.com/${owner}/${repo}/pull/${pr})\n`)
      .join(),
  };
}
