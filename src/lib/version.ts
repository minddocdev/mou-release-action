import * as semver from 'semver';
import * as core from '@actions/core';
import { context, GitHub } from '@actions/github';

export enum VersionType {
  major = 'major',
  minor = 'minor',
  patch = 'patch',
}

const findReleaseTag = async (github: GitHub, matchFunction: (release: {}) => {}) => {
  const { owner, repo } = context.repo;

  // Using pagination: https://octokit.github.io/rest.js/v17#pagination
  const listReleasesOptions = github.repos.listReleases.endpoint.merge({
    owner,
    repo,
  });

  // Look for the earliest release that matches the given condition
  /* eslint-disable no-restricted-syntax */
  for await (const response of github.paginate.iterator(listReleasesOptions)) {
    for (const release of response.data) {
      if (matchFunction(release)) return release.tag_name;
    }
  }
  /* eslint-enable no-restricted-syntax */
  return undefined;
};

export async function bumpVersion(github: GitHub, tagPrefix: string, nextVersionType: VersionType) {
  const matchesTagPrefix = (release) => release.tag_name.startsWith(tagPrefix);
  const lastTag = (await findReleaseTag(github, matchesTagPrefix));
  const lastVersion = lastTag ? lastTag.replace(tagPrefix, '') : '0.0.0';
  const newVersion = semver.inc(lastVersion, nextVersionType);
  const newTag = `${tagPrefix}${newVersion}`;
  core.setOutput('previous_tag', lastTag);
  core.setOutput('previous_version', lastVersion);
  core.setOutput('new_tag', newTag);
  core.setOutput('new_version', newVersion);
  return newTag;
}

export async function retrieveLastReleasedVersion(github: GitHub, tagPrefix: string) {
  const isVersionReleased = (release) => {
    const { prerelease, draft, tag_name: tagName } = release;
    return !draft && !prerelease && tagName.startsWith(tagPrefix);
  };
  const lastPublishedTag  = await findReleaseTag(github, isVersionReleased);
  core.setOutput('base_tag', lastPublishedTag || '');
  return lastPublishedTag;
}
