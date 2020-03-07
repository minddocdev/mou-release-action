# MOU Release Action

Creates a Github release with parsed commits into a given Markdown template.

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

## Options

### Inputs

#### `app`

- name: app
- required: true
- description: The name of the app involved in the release.

#### `baseTag`

- name: baseTag
- required: false
- description: The tag that will be used as base for git commit comparison, instead of the automatic detection of latest published release. The commits will be formatted into a Markdown list and replaced into the `$CHANGES` variable for the given `templatePath` template file.

#### `draft`

- name: draft
- required: false
- default: `true`
- description: Publish release draft.

#### `monorepo`

- name: monorepo
- required: false
- description: Creates tag and render commits for a specific scope, based on the given app name. Scopes from commits are analyzed for commits that follow the Angular commit style. e.g. `<type>(<app>): my commit title` or `(<app>): my commit title`

#### `prerelease`

- name: prerelease
- required: false
- default: `true`
- description: Mark release as prerelease when creating.

#### `releaseName`

- name: releaseName
- required: true
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

#### `new_version`

- name: new_version
- description: The bumped semantic version.

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

Create a Markdown template (`$APP` and `$CHANGES` would be replaced by `app`
and the parsed `commits` respectively).

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

Use the action to create a release:

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
        uses: minddocdev/mou-version-action@v1.0.0
        id: bump_version
        with:
          prefix: ${{ env.APP }}@
          token: ${{ github.token }}
      - name: Create Release
        uses: minddocdev/mou-release-action@v1.0.0
        with:
          app: ${{ env.APP }}
          commitDiffRef: tags/my-production-deployed-tag
          releaseName: ${{ env.APP }} ${{ steps.bump_version.outputs.version }}
          releaseTag: ${{ steps.bump_version.outputs.tag }}
          templatePath: ./github/RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```

If your commits follow the [Angular Commit Message Conventions](https://gist.github.com/stephenparish/9941e89d80e2bc58a153)
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

In this case, all commits that will be added to the production release are displayed here.

In addition, you can render project management tasks and PRs. The PR rendering follows Github's
format (where squash and rebase commits output `(#<PR_ID>)`).
