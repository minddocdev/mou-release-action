import { setOutput } from '@actions/core';
import {
  retrieveLastReleasedVersion, bumpVersion, VersionType,
} from '@minddocdev/mou-release-action/lib/version';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'theowner',
      repo: 'therepo',
    },
  },
}));
jest.mock('@actions/core');

interface ReleaseFixture {
  data: { prerelease: boolean, draft: boolean, tag_name: string }[]
}

describe('version', () => {
  const tagPrefix = 'myprefix@';
  const releaseResponseFixture = [
    { data: [
        { prerelease: true, draft: true, tag_name: `${tagPrefix}0.0.4` }, // Latest version
        { prerelease: false, draft: false, tag_name: 'fake-prefix-0.0.3' },
        { prerelease: false, draft: false, tag_name: '0.0.3' },
      ]
    },
    { data: [
        { prerelease: true, draft: true, tag_name: `${tagPrefix}0.0.3` },
        { prerelease: true, draft: false, tag_name: `${tagPrefix}0.0.2` },
        { prerelease: false, draft: false, tag_name: `${tagPrefix}0.0.1` }, // Production release
      ],
    },
  ]

  const mockGithub = (fixture: ReleaseFixture[]): any => {
    const listReleasesMock = jest.fn(() => 'iterator-options');
    const listReleasesIteratorMock = jest.fn(() => fixture);
    return {
      paginate: { iterator: listReleasesIteratorMock },
      repos: { listReleases: { endpoint: { merge: listReleasesMock } } },
    };
  };

  beforeEach(jest.restoreAllMocks);

  describe('bump version', () => {
    test('bump PATCH when there is no last tag', async () => {
      expect(await bumpVersion(mockGithub([{ data: [] }]), tagPrefix, VersionType.patch))
        .toBe(`${tagPrefix}0.0.1`);
      expect(setOutput).toBeCalledWith('previous_tag', undefined);
      expect(setOutput).toBeCalledWith('previous_version', '0.0.0');
      expect(setOutput).toBeCalledWith('new_tag', `${tagPrefix}0.0.1`);
      expect(setOutput).toBeCalledWith('new_version', '0.0.1');

    });

    test('bump MINOR', async () => {
      expect(await bumpVersion(mockGithub(releaseResponseFixture), tagPrefix, VersionType.minor))
        .toBe(`${tagPrefix}0.1.0`);
      expect(setOutput).toBeCalledWith('previous_tag', `${tagPrefix}0.0.4`);
      expect(setOutput).toBeCalledWith('previous_version', '0.0.4');
      expect(setOutput).toBeCalledWith('new_tag', `${tagPrefix}0.1.0`);
      expect(setOutput).toBeCalledWith('new_version', '0.1.0');
    });

    test('bump MAJOR', async () => {
      expect(await bumpVersion(mockGithub(releaseResponseFixture), tagPrefix, VersionType.major))
        .toBe(`${tagPrefix}1.0.0`);
      expect(setOutput).toBeCalledWith('previous_tag', `${tagPrefix}0.0.4`);
      expect(setOutput).toBeCalledWith('previous_version', '0.0.4');
      expect(setOutput).toBeCalledWith('new_tag', `${tagPrefix}1.0.0`);
      expect(setOutput).toBeCalledWith('new_version', '1.0.0');
    });
  });

  test('retrieve last published release', async () => {
    const expectedTag = `${tagPrefix}0.0.1`;

    expect(await retrieveLastReleasedVersion(mockGithub(releaseResponseFixture), tagPrefix)).toBe(
      expectedTag,
    );
    expect(setOutput).toBeCalledWith('base_tag', expectedTag);
  });

  test('retrieve no release', async () => {
    const releaseFixtureOverride = [
      {
        data: [
          { prerelease: true, draft: true, tag_name: `${tagPrefix}0.0.4` },
        ],
      },
      {
        data: [
          { prerelease: true, draft: false, tag_name: `${tagPrefix}0.0.2` },
          { prerelease: false, draft: true, tag_name: `${tagPrefix}0.0.1` },
        ],
      },
    ];

    expect(await retrieveLastReleasedVersion(mockGithub(releaseFixtureOverride), tagPrefix))
      .toBe(undefined);
    expect(setOutput).toBeCalledWith('base_tag', '');
  });
});
