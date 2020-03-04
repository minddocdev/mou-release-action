import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { context, GitHub } from '@actions/github';

export async function createGithubRelease(
  github: GitHub,
  templatePath: string,
  tag: string,
  releaseName: string,
  draft: boolean,
  prerelease: boolean,
  app: string,
  changes: string,
) {
  const { owner, repo } = context.repo;

  // Create body from given template
  let body = fs
    .readFileSync(
      path.resolve('/home/runner/work', repo, repo, '.github', templatePath),
      'utf8',
    )
    .replace(/\$APP/g, app);
  if (changes) {
    body = body.replace(/\$CHANGES/g, changes);
  }

  // Create a release
  // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
  const createReleaseResponse = await github.repos.createRelease({
    owner,
    repo,
    // eslint-disable-next-line @typescript-eslint/camelcase
    tag_name: tag,
    name: releaseName,
    body,
    draft,
    prerelease,
  });

  // Get the ID, html_url, and upload URL for the created Release from the response
  const {
    data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
  } = createReleaseResponse;

  core.setOutput('id', releaseId.toString());
  core.setOutput('html_url', htmlUrl);
  core.setOutput('upload_url', uploadUrl);
}
