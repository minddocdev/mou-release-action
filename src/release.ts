import * as core from '@actions/core';
import { GitHub, context } from '@actions/github';

export async function createRelease(
  token: string,
  tag: string,
  releaseName: string,
  body: string,
  draft: boolean,
  prerelease: boolean,
) {
  const github = new GitHub(token);
  const { owner, repo } = context.repo;

  // Create a release
  // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
  const createReleaseResponse = await github.repos.createRelease({
    owner,
    repo,
    tag_name: tag, // eslint-disable-line @typescript-eslint/camelcase
    name: releaseName,
    body,
    draft,
    prerelease
  });

  // Get the ID, html_url, and upload URL for the created Release from the response
  const {
    data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
  } = createReleaseResponse;

  core.setOutput('id', releaseId.toString());
  core.setOutput('html_url', htmlUrl);
  core.setOutput('upload_url', uploadUrl);
}
