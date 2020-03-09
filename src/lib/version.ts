import semver from 'semver';
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
      if (matchFunction(release)) return release.tag_name as string;
    }
  }
  /* eslint-enable no-restricted-syntax */
  return undefined;
};

export async function bumpVersion(
  github: GitHub,
  tagPrefix: string,
  nextVersionType = VersionType.patch,
  publishedTag?: string,
  bumpProtection = false,
) {
  const publishedVersion = publishedTag ? publishedTag.replace(tagPrefix, '') : undefined;

  const matchesTagPrefix = (release) => release.tag_name.startsWith(tagPrefix);
  const lastTag = (await findReleaseTag(github, matchesTagPrefix));
  const lastVersion = lastTag ? lastTag.replace(tagPrefix, '') : '0.0.0';

  // Detect if there was a minor or major update between the latest production tag (baseTag)
  // and the latest tag (the one that will be bumped), if bump is not a patch.
  // If a major or minor update already happened, perform a patch instead.
  // Production deployments will never bump a minor or major more than once, while internal
  // tags can be bumped
  let releaseType = nextVersionType;
  if (
    bumpProtection &&
    publishedVersion &&
    // MINOR protection (if there was already a previous MINOR bump)
    ((nextVersionType === VersionType.minor &&
      !semver.satisfies(
        lastVersion,
        // ^1.2	is >=1.2.0 <2.0.0
        `^${semver.major(publishedVersion)}.${semver.minor(publishedVersion)}`,
      )) ||
      // MAJOR protection (if there was already a previous MAJOR bump)
      (nextVersionType === VersionType.major &&
        !semver.satisfies(
          lastVersion,
          // ^1	is >=1.0.0 <2.0.0
          `^${semver.major(publishedVersion)}`,
        )))
  ) {
    releaseType = VersionType.patch;
  }

  const newVersion = semver.inc(lastVersion, releaseType);
  if (newVersion === null) {
    throw new Error(`Unable to perform a ${releaseType} bump to version ${lastVersion}`);
  }
  const newTag = `${tagPrefix}${newVersion}`;

  core.setOutput('previous_tag', lastTag || '');
  core.setOutput('previous_version', lastVersion);
  core.setOutput('new_tag', newTag);
  core.setOutput('new_version', newVersion);
  core.setOutput('release_type', releaseType);
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
