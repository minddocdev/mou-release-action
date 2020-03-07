# MOU Release Action

Creates a Github release with parsed commits into a given Markdown template.

[![main](https://github.com/minddocdev/mou-release-action/workflows/main/badge.svg)](https://github.com/minddocdev/mou-release-action/actions?workflow=main)

## Options

### Inputs

#### `app`

- name: app
- required: true
- description: The name of the app involved in the release.

#### `baseTag`

- name: baseTag
- required: false
- description: The tag that will be used as base for git commit comparison,
instead of the automatic detection of latest published release.
The commits will be formatted into a Markdown list and replaced into the `$CHANGES`
variable for the given `templatePath` template file.

#### `draft`

- name: draft
- required: false
- default: `true`
- description: Publish release draft.

#### `monorepo`

- name: monorepo
- required: false
- description: Creates tag and render commits for a specific scope, based on the given app name.
Scopes from commits are analyzed for commits that follow the Angular commit style.
e.g. `<type>(<app>): my commit title` or `(<app>): my commit title`

#### `prerelease`

- name: prerelease
- required: false
- default: `true`
- description: Mark release as prerelease when creating.

#### `releaseName`

- name: releaseName
- required: false
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

## Usage

### Action definition

Use the action to create a release.

For given tags (automatic tag creation would be disabled):

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
          templatePath: ./github/RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```

In the following example, the action will check for the latest published release that matches
`myapp@` prefix, create a changelog for all the commits that has the `(myapp)` scope,
and bump the version to `minor`, `major` or `patch` depending on the commit messages and if there
was a previous `minor` or `major` bump in the diff with the latest published tag.

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
          monorepo: true
          templatePath: ./github/RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```

### Template

Create a Markdown template that will be used for the release body. Reference it with the
`templatePath` input. For example:

```md
# $APP release

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

#### Template variables

The action will replace the following variables:

- `$APP`: the `app` input
- `$CHANGES`: the rendered list of commit messages. See [commit format](#commit-format).
- `$TASKS`: the bullet list of detected tasks. See [task format](#task-format).
- `$PULL_REQUESTS`: the list of Github PRs. See [PR format](#pr-format).

##### Commit format

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

If the `monorepo` setting is true, commits that only have the `(<app>)` scope will be shown.
Being `<app>` the input given to the action.

Of course, in case you do not want to follow a specific commit style at all,
all changes will rendered without any fancy categorization:

```md
## :alien: Changelog

- Uncategorized commit 1 - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))
- Uncategorized commit 2 - [62ec8ea7](https://commiturl)([@darioblanco](https://authorurl))
```

##### Task format

Tasks are detected with the given `taskPrefix` and the hyperlink is created with `taskBaseUrl`.
If none of these parameters are given, a default `JIRA-` prefix and
`https://<REPO_ORG>.atlassian.net/browse` values are used.

The output is a bullet list:

```md
## JIRA

- [JIRA-123](https://myorg.atlassian.net/browse/JIRA-123)
- [JIRA-456](https://myorg.atlassian.net/browse/JIRA-456)
```

##### PR format

In addition, you can render project management tasks and PRs. The PR rendering follows Github's
format (where squash and rebase commits output `(#<PR_ID>)`).

```md
## PRs

- [#1716](https://github.com/myorg/myrepo/pull/1716)
- [#1717](https://github.com/myorg/myrepo/pull/1717)
```

#### Commit style

In case you want to take full power of changelog categories, the action offers a way to classify
them in the release body.

The commit style is strongly influenced by [Angular Commit Message Conventions](https://gist.github.com/stephenparish/9941e89d80e2bc58a153).

##### Type

The following commit *types* are detected (using `<type>:` or `<type>(<scope>):` at
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

The *scope* is required when `monorepo` mode is enabled, in order to only generate a changelog
for those commits that belong to the specific app. Therefore, all relevant commit messages
should have the `<type>(<scope>)` or `(<scope>)` format. Scope should be equal to the given
`app` input.

#### `MAJOR`, `MINOR` and `PATCH` bumps

By default, all release versions will be bumped using `PATCH`. Therefore, this action defines
different logic to bump using `MINOR` and `MAJOR`.

##### `MINOR` bumps

If there is a `feat` in the commit diff between the latest published release and the current one,
the action will suggest a `MINOR` release bump. This release type should only be used when new
features are deployed to production.

As an alternative, it will also do a `MINOR` bump if there is a `#MINOR` string found
in any commit message from the diff.

##### `MAJOR` bumps

If there is a `#MAJOR` string found in any commit message from the diff, the action will suggest
a `MAJOR` release bump. As this release type involves backwards incompatible changes, the behavior
should be fully controlled by the user.

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
