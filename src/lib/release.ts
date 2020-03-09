import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { context, GitHub } from '@actions/github';

export function renderReleaseName(
  draft: boolean,
  prerelease: boolean,
  app?: string,
) {
  let releaseName = `release ${app || ''}`;
  if (draft || prerelease) {
    releaseName = `${draft ? 'draft ' : ''}${prerelease ? 'prerelease ' : ''}${app || ''}`;
  }
  // Capitalize string
  return `${releaseName[0].toUpperCase()}${releaseName.slice(1)}`.trim();
}

export function renderReleaseBody(
  templatePath: string,
  app: string,
  releaseVersion: string,
  changes = '',
  tasks = '',
  pullRequests = '',
) {
  const { repo } = context.repo;
  let body = fs
    .readFileSync(
      path.resolve('/home/runner/work', repo, repo, '.github', templatePath),
      'utf8',
    )
    .replace(/\$APP/g, app).replace(/\$VERSION/g, releaseVersion);
  body = body.replace(/\$CHANGES/g, changes);
  body = body.replace(/\$TASKS/g, tasks);
  body = body.replace(/\$PULL_REQUESTS/g, pullRequests);
  return body;
}

export async function createGitTag(github: GitHub, tag: string) {
  const { owner, repo } = context.repo;
  const { sha } = context;

  const { status } = await github.git.createRef({
    owner,
    repo,
    sha,
    ref: `refs/tags/${tag}`,
  });
  if (status !== 201) {
    throw new Error(`Unable to create tag ${tag}. Github returned status ${status}`);
  }
}

export async function createGithubRelease(
  github: GitHub,
  tag: string,
  name: string,
  body: string,
  draft: boolean,
  prerelease: boolean,
) {
  const { owner, repo } = context.repo;
  // Create a release
  // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
  const createReleaseResponse = await github.repos.createRelease({
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
    data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
  } = createReleaseResponse;

  core.setOutput('release_id', releaseId.toString());
  core.setOutput('html_url', htmlUrl);
  core.setOutput('upload_url', uploadUrl);
}
