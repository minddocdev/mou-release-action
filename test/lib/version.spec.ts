/* eslint-disable @typescript-eslint/camelcase */
import { setOutput } from '@actions/core';
import { retrieveLastReleasedVersion, bumpVersion, VersionType } from '@minddocdev/mou-release-action/lib/version';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'theowner',
      repo: 'therepo',
    },
  },
}));
jest.mock('@actions/core');

describe('version', () => {
  const tagPrefix = 'myprefix@';

  test('retrieve last published release', () => {
    expect(bumpVersion('git-token', tagPrefix, VersionType.patch)).toBe('');
  });

  test('retrieve last published release', async () => {
    const expectedTag = `${tagPrefix}0.0.1`;

    const listReleasesMock = jest.fn(() => 'iterator-options');
    const listReleasesIteratorMock = jest.fn(() => [
      { data: [
          { prerelease: true, draft: true, tag_name: `${tagPrefix}0.0.4` },
          { prerelease: false, draft: false, tag_name: 'fake-prefix-0.0.3' },
          { prerelease: false, draft: false, tag_name: '0.0.3' },
        ]
      },
      { data: [
          { prerelease: true, draft: true, tag_name: `${tagPrefix}0.0.3` },
          { prerelease: true, draft: false, tag_name: `${tagPrefix}0.0.2` },
          { prerelease: false, draft: false, tag_name: expectedTag },
        ],
      },
    ]);
    const github = {
      paginate: { iterator: listReleasesIteratorMock },
      repos: { listReleases: { endpoint: { merge: listReleasesMock } } },
    };

    expect(await retrieveLastReleasedVersion(github as any, tagPrefix)).toBe(expectedTag);
    expect(listReleasesMock).toBeCalledWith({ owner: 'theowner', repo: 'therepo' });
    expect(listReleasesIteratorMock).toBeCalledWith('iterator-options');
    expect(setOutput).toBeCalledWith('base_tag', expectedTag);
  });
});
