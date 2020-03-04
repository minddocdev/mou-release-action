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

## Inputs

### `app`

- name: app
- required: true
- description: The name of the app involved in the release.

### `commits`

- name: commits
- required: false
- default: []
- description: Inject commit list as given by Github
(e.g. for git push event: `github.event.commits`).

### `draft`

- name: draft
- required: false
- default: true
- description: Publish release draft.

### `prerelease`

- name: prerelease
- required: false
- default: true
- description: Mark release as prerelease when creating.

### `releaseName`

- name: releaseName
- required: false
- default: `[${app}] ${{tag}}`
- description: The title of the release.

### `releaseTag`

- name: releaseTag
- required: true
- description: The git tag that belongs to the release.

### `templatePath`

- name: templatePath
- required: true
- description: The path for the Markdown template that will be used to create the release body,
relative to `.github/`.

### `token`

- name: token
- required: true
- description: The token to access Github's API.

## Usage

Create a Markdown template (`$APP` and `$CHANGES` would be replaced by `app`
and the parsed `commits` respectively).

```md
# $APP release

## Changelog

$CHANGES

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
        uses: minddocdev/github-tag-action@master
        id: bump_version
        with:
          prefix: ${{ env.APP }}
          token: ${{ github.token }}
      - name: Create Release
        uses: minddocdev/mou-release-action@v1.0.0
        with:
          app: ${{ env.APP }}
          commits: ${{ github.event.commits }}
          tag: ${{ steps.bump_version.outputs.tag }}
          templatePath: ./github/RELEASE_DRAFT/default.md
          token: ${{ github.token }}
```
