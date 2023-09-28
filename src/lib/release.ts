import * as fs from 'fs';
import * as path from 'path';

import * as core from '@actions/core';
import * as github from '@actions/github';

import { Octokit } from '@octokit/rest';

export function renderReleaseName(releaseVersion: string, app?: string): string {
  return `${app ? `${app}@` : ''}${releaseVersion}`.trim();
}

function createReleaseNotes(
  releaseNotesFilepath: string,
  releaseNotesLanguageTags: string,
): string {
  return releaseNotesLanguageTags
    .split(',')
    .map((entry) => {
      const tag = entry.trim();
      const filepath = releaseNotesFilepath.replace('{LANGUAGE_TAG}', tag);
      const releaseNotes = fs.readFileSync(filepath, 'utf8');
      return `${tag}\n${releaseNotes}\n`;
    })
    .join('\n');
}

export function renderReleaseBody(
  templatePath: string,
  app: string,
  releaseVersion: string,
  changes = '',
  tasks = '',
  pullRequests = '',
  releaseNotesFilepath = '',
  releaseNotesLanguageTags = '',
): string {
  const { repo } = github.context.repo;
  let body = fs
    .readFileSync(path.resolve('/home/runner/work', repo, repo, '.github', templatePath), 'utf8')
    .replace(/\$APP/g, app)
    .replace(/\$VERSION/g, releaseVersion);

  body = body.replace(/\$CHANGES/g, changes);
  body = body.replace(/\$TASKS/g, tasks);
  body = body.replace(/\$PULL_REQUESTS/g, pullRequests);

  if (releaseNotesFilepath !== '') {
    body = body.replace(
      /\$RELEASE_NOTES/g,
      createReleaseNotes(releaseNotesFilepath, releaseNotesLanguageTags),
    );
  }

  return body;
}

export async function createGitTag(
  octokit: InstanceType<typeof Octokit>,
  tag: string,
): Promise<void> {
  const { owner, repo } = github.context.repo;
  const { sha } = github.context;

  const response = await octokit.git.createRef({
    owner,
    repo,
    sha,
    ref: `refs/tags/${tag}`,
  });
  if (response.status !== 201) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Unable to create tag ${tag}. Github returned status: ${response.status}`);
  }
}

export async function createGithubRelease(
  octokit: InstanceType<typeof Octokit>,
  tag: string,
  name: string,
  body: string,
  draft: boolean,
  prerelease: boolean,
): Promise<void> {
  const { owner, repo } = github.context.repo;
  // Create a release
  // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
  const createReleaseResponse = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name,
    body,
    draft,
    prerelease,
  });

  // Get the ID, html_url, and upload URL for the created Release from the response
  const {
    data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl },
  } = createReleaseResponse;

  core.setOutput('release_id', releaseId.toString());
  core.setOutput('html_url', htmlUrl);
  core.setOutput('upload_url', uploadUrl);
}
