# MOU Release Action

Creates a Github release with parsed commits into a given Markdown template.

[![main](https://github.com/minddocdev/mou-release-action/workflows/main/badge.svg)](https://github.com/minddocdev/mou-release-action/actions?workflow=main)

Actually, the `mou-release-action` creates [releases](https://github.com/minddocdev/mou-release-action/releases)
for `mou-release-action`.

![xzibit](https://i.imgur.com/FP1KQOR.png?1)

## Usage

Simplest usage, (single application per repository), and the action will check for
the latest published release that matches the `v` prefix, create a changelog for all the
commits in that diff and suggest a version bump to `prerelease` (as by default the `prerelease`
draft checkbox will be filled).

```yaml
name: 'myrelease'
on:
  push:
    branches:
      - master
jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - name: Create Release
        uses: minddocdev/mou-release-action@master
        with:
          templatePath: RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```

For given tags, where automatic tag suggestion is disabled and the commit parsing is controlled
by `baseTag` and `releaseTag`:

```yaml
name: 'myrelease'
on:
  push:
    branches:
      - master
jobs:
  bump:
    runs-on: ubuntu-latest
    env:
      APP: myapp
    steps:
      - name: Checkout git repository
        uses: actions/checkout@master
      - name: Bump version and push tag
        uses: minddocdev/mou-version-action@master
        id: bump_version
        with:
          prefix: ${{ env.APP }}@
          token: ${{ github.token }}
      - name: Create Release
        uses: minddocdev/mou-release-action@master
        with:
          app: ${{ env.APP }}
          baseTag: my-production-deployed-tag
          releaseName: ${{ env.APP }} ${{ steps.bump_version.outputs.version }}
          releaseTag: ${{ steps.bump_version.outputs.tag }}
          templatePath: RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```

More complex example, where the action will check for the latest published release that matches
`myapp@` prefix, create a changelog for all the commits that has the `(myapp)` scope,
and bump the version to `minor`, `major` or `patch` depending on the commit messages and if there
was a previous `minor` or `major` bump in the diff with the latest published tag.
As the `prerelease` parameter is `false`, the draft won't have the `prerelease` checkbox and
the proposed tag won't have the `-rc.X` suffix.
This setting is ideal for monorepos, where multiple release scopes live.

```yaml
name: 'myrelease'
on:
  push:
    branches:
      - master
jobs:
  bump:
    runs-on: ubuntu-latest
    env:
      APP: myapp
    steps:
      - name: Checkout git repository
        uses: actions/checkout@master
      - name: Create Release
        uses: minddocdev/mou-release-action@master
        with:
          app: ${{ env.APP }}
          prerelease: false
          templatePath: RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```

## Options

### Inputs

#### `app`

- name: app
- required: false
- description: The name of the app involved in the release.
  Creates tag and render commits for a specific scope, based on the given app name.
  Scopes from commits are analyzed for commits that follow the Angular commit style.
  e.g. `<type>(<app>): my commit title` or `(<app>): my commit title`

#### `baseTag`

- name: baseTag
- required: false
- description: The tag that will be used as base for git commit comparison,
  instead of the automatic detection of latest published release.
  The commits will be formatted into a Markdown list and replaced into the `$CHANGES`
  variable for the given `templatePath` template file.

#### `bumpProtection`

- name: bumpProtection
- required: false
- default: `false`
- description: Propose PATCH version bumps whenever a MINOR or MAJOR is detected
  in a diff that had a previous MINOR or MAJOR bump.
  See [multiple minor and major bump protection](#multiple-minor-and-major-bump-protection).

#### `draft`

- name: draft
- required: false
- default: `true`
- description: Publish release draft.

#### `prerelease`

- name: prerelease
- required: false
- default: `true`
- description: Mark release as prerelease when creating.
  This will ignore `major`, `minor` and `patch` bump suggestions and propose a [prerelease](https://github.com/npm/node-semver#prerelease-tags).

#### `pushTag`

- name: pushTag
- required: false
- default: `false`
- description: Creates and pushes the automatic calculated tag before creating the release.
  Useful if you want the action to handle tags for you when publishing drafts.
  By default, a release draft won't create the tag, which only happens when it is published.

#### `releaseName`

- name: releaseName
- required: false
- default: `<app> <version>`
- description: The title of the release.

#### `releaseTag`

- name: releaseTag
- required: true
- description: The git tag that belongs to the release.

#### `taskBaseUrl`

- name: taskBaseUrl
- required: false
- description: The base url to append for a detected task (do not set a trailing `/`).
  By default, it will create a url based on your Github organization.
  (e.g. `https://myorg.atlassian.net/browse`)

#### `taskPrefix`

- name: taskPrefix
- required: false
- default: `JIRA-`
- description: The prefix that identifies task ids in the commits

#### `templatePath`

- name: templatePath
- required: true
- description: The path for the Markdown template that will be used to create the release body,
  relative to `.github/`.

#### `token`

- name: token
- required: true
- description: The token to access Github's API.

#### `releaseNotesFilepath`

- name: releaseNotesFilepath
- required: false
- description: Filepath where release notes are located, using the placeholder `{LANGUAGE_TAG}`. E.g. /some_path/{LANGUAGE_TAG}/release_notes.txt

#### `releaseNotesLanguageTags`

- name: releaseNotesLanguageTags
- required: false
- description: Language tags (e.g. en-GB, de-DE) to generate localized release notes. More info: https://www.w3.org/International/articles/language-tags/

### Outputs

#### `changes`

- name: changes
- description: A JSON array with the list of commit sha that are involved in the release.

#### `new_tag`

- name: new_tag
- description: The newly created tag that will reference the release.

#### `new_version`

- name: new_version
- description: The newly created version that belongs to the tag.

#### `html_url`

- name: html_url
- description: The browser url linking to Github's release.

#### `tasks`

- name: tasks
- description: A JSON array with the list of project management tasks involved in the release.

#### `previous_tag`

- name: previous_tag
- description: The previously detected tag that was bumped by the action.

#### `previous_version`

- name: previous_version
- description: The previously detected version that was bumped by the action.

#### `pull_requests`

- name: pull_requests
- description: A JSON array with the list of Github pull requests involved in the release.

#### `release_id`

- name: release_id
- description: The release id given by Github's API.

#### `upload_url`

- name: upload_url
- description: The url used for uploading release artifacts.

## Template

Create a Markdown template that will be used for the release body. Reference it with the
`templatePath` input. For example:

```md
# $APP $VERSION release

## Changelog

$CHANGES

## JIRA Tasks

$TASKS

## Pull Requests

$PULL_REQUESTS

## Checklist

- [ ] Check 1

  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
```

## Release Notes

$RELEASE_NOTES

### Template variables

The action will replace the following variables:

- `$APP`: the `app` input.
- `$VERSION`: the updated version without `tagPrefix`.
- `$CHANGES`: the rendered list of commit messages. See [commit format](#commit-format).
  Commits will be detected if a `baseRef` is given or if another previous (and matching) tag was
  pushed to the repository and its release was published (automatic detection).
- `$TASKS`: the bullet list of detected tasks. See [task format](#task-format).
- `$PULL_REQUESTS`: the list of Github PRs. See [PR format](#pr-format).
- `$RELEASE_NOTES`: generated release notes from a filepath. See [release notes](#releasenotesfilepath).

#### Commit format

If your commits follow the expected [commit style](#commit-types)
the action will automatically categorize them in `$CHANGES` like in the following example:

```md
## :alien: Changelog

- Uncategorized commit - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:zap: Features**

- Super feature - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:wrench: Fixes**

- My fix - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:books: Documentation**

- Document everything - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:nail_care: Style changes**

- Awesome style - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:mountain: Refactors**

- One does not simply refactor - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:traffic_light: Tests**

- Tests are good - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))

**:construction: Maintenance**

- Somebody has to keep things going - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))
```

In this case, all commits that will be added to the production release are displayed here. The ones
that did not follow any commit style where at the top of the changelog without a category.

If the `app` input is given, commits that only have the `(<app>)` scope will be shown.
Being `<app>` the input given to the action.

Of course, in case you do not want to follow a specific commit style at all,
all changes will rendered without any fancy categorization:

```md
## :alien: Changelog

- Uncategorized commit 1 - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))
- Uncategorized commit 2 - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))
```

#### Task format

Tasks are detected with the given `taskPrefix` and the hyperlink is created with `taskBaseUrl`.
If none of these parameters are given, a default `JIRA-` prefix and
`https://<REPO_ORG>.atlassian.net/browse` values are used.

The output is a bullet list:

```md
## JIRA

- [JIRA-123](https://myorg.atlassian.net/browse/JIRA-123)
- [JIRA-456](https://myorg.atlassian.net/browse/JIRA-456)
```

#### PR format

In addition, you can render project management tasks and PRs. The PR rendering follows Github's
format (where squash and rebase commits output `(#<PR_ID>)`).

```md
## PRs

- [#1716](https://github.com/myorg/myrepo/pull/1716)
- [#1717](https://github.com/myorg/myrepo/pull/1717)
```

## Commit style

In case you want to take full power of changelog categories, the action offers a way to classify
them in the release body.

### Commit Message Conventions

The commit style follows [Conventional Commits](https://www.conventionalcommits.org/),
and is able to group changes in the changelog if some specific types are given.

#### Type

The following commit _types_ are detected (using `<type>:` or `<type>(<scope>):` at
the beginning of the commit message or in the Github squash line):

- `feat`: a new feature
- `fix`: a bug fix
- `perf`: a code change that improves performance
- `docs`: documentation only changes
- `style`: changes that do not affect the meaning of the code (lint changes)
- `refactor`: a code change that neither fixes a bug nor adds a feature
- `test`: adding missing tests or correcting existing tests
- `chore`: changes that affect the system or external development dependencies
- `build`: as an alternative to `chore`, but with very similar m eaning
  (updated in `Angular` commit style)
- `ci`: changes for CI configuration files and scripts

#### Scope

The _scope_ is required when an `app` is given, in order to only generate a changelog
for those commits that belong to the specific app. Therefore, all relevant commit messages
should have the `<type>(<scope>):` or `(<scope>):` format
(though the latter is not considered a conventional commit).
Scope should be equal to the given `app` input.

### Automatic semantic version type detection

By default, all release versions will be bumped using `PATCH`. Therefore, this action defines
different logic to bump using `MINOR` and `MAJOR`.

#### `MINOR` bumps

If there is a `feat` in the commit diff between the latest published release and the current one,
the action will suggest a `MINOR` release bump. This release type should only be used when new
features are deployed to production.

As an alternative, it will also do a `MINOR` bump if there is a `#MINOR` string found
in any commit message from the diff.

#### `MAJOR` bumps

If there is a `#MAJOR` string found in any commit message from the diff, the action will suggest
a `MAJOR` release bump. As this release type involves backwards incompatible changes, the behavior
should be fully controlled by the user.

#### Multiple `MINOR` and `MAJOR` bump protection

**Bump protection is disabled by default, but you can enable passing the `bumpProtection` input.**

For teams with a slower production release cadence that push a lot of tags automatically,
it would be easy to end up with a production deployment that has a big diff between
`MINOR` and `MAJOR` versions.
As we believe users are the ones who should get the biggest benefit from semantic versioning,
it might not make sense if they see a big number gap in those.

Therefore, the release type protection will do a `PATCH` if there was already an **unreleased**
`MAJOR` or `MINOR` bump in the diff.

For example, `MINOR` protection:

- `1.1.0` -> published release (`baseTag`)
- `1.2.0` -> `MINOR` bump (two new features)
- `1.2.1` -> it detected a `MINOR` bump, but it is default to `PATCH` (one new feature)
- `1.2.3` -> it detected a `MINOR` bump, but it is default to `PATCH` (three new features)
- `1.2.4` -> newly published released with three backwards compatible changes, it would be
  `1.4.0` without the protection, losing `1.2.0` and `1.3.0` on the way. As we want to avoid
  those big gaps while encouraging small branches, the protection limits the `MINOR` bump to 1,
  patching the rest. Users would still see that there are new features in the release.

Users have seen `1.1.0` going up to `1.2.4`, instead of `1.4.0`.
Truncated would be `1.1` and `1.2`.

And a `MAJOR` protection example:

- `1.1.0` -> published release (`baseTag`)
- `1.2.0` -> `MINOR` bump (two new features)
- `1.2.1` -> it detected a `MINOR` bump, but it is default to `PATCH` (one new feature)
- `2.0.0` -> it detected a `MAJOR` bump, overrides the `MINOR` protection (manual `#MAJOR` message)
- `2.0.1` -> it detected a `MINOR` bump, but it is default to `PATCH` (three new features)
- `2.0.2` -> it detected a `MAJOR` bump, but protection defaults to `PATCH`
- `2.0.3` -> newly published release (one bugfix before releasing)

Users have seen `1.1.0` going up to `2.0.3` instead of `3.0.1`.
Truncated would be `1.1` and `2.0`.

## Development

Install dependencies

```bash
yarn
```

Compile typescript

```bash
yarn build
```

Lint code

```bash
yarn lint
```

Run the tests

```bash
yarn test
```
