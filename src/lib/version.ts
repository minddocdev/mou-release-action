import * as core from '@actions/core';
import { context, GitHub } from '@actions/github';

export enum VersionType {
  major = 'major',
  minor = 'minor',
  patch = 'patch',
}

export function bumpVersion(token: string, tagPrefix: string, nextVersionType: VersionType) {
  // Using pagination: https://octokit.github.io/rest.js/v17#pagination
  // const listMatchingRefsOptions = github.git.listMatchingRefs.endpoint.merge({
  //   owner,
  //   repo,
  //   ref: `tags/${tagPrefix}`,
  // });

  // TODO - Use nodegit

  // Find latest tag, bump and push it
  return '';
}

export async function retrieveLastReleasedVersion(github: GitHub, tagPrefix: string) {
  const { owner, repo } = context.repo;

  // Using pagination: https://octokit.github.io/rest.js/v17#pagination
  const listReleasesOptions = github.repos.listReleases.endpoint.merge({
    owner,
    repo,
  });

  const findRelease = async () => {
    // Look for the earliest published release that matches the tag prefix (if given)
    /* eslint-disable no-restricted-syntax */
    for await (const response of github.paginate.iterator(listReleasesOptions)) {
      for (const release of response.data) {
        const { prerelease, draft, tag_name: tagName } = release;
        if (!draft && !prerelease && tagName.startsWith(tagPrefix)) {
          return release;
        }
      }
    }
    /* eslint-enable no-restricted-syntax */
    return { tag_name: undefined };
  };

  const { tag_name: lastPublishedTag } = await findRelease();
  core.setOutput('base_tag', lastPublishedTag || '');
  return lastPublishedTag;
}
