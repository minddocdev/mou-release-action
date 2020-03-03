import * as fs from 'fs';

import {generateReleaseBody} from '@minddocdev/mou-release-action/template';
import {Commit, CommitAuthor} from '@minddocdev/mou-release-action/index';

jest.mock('fs');

const commitAuthor: CommitAuthor = {
  email: 'dblancoit@gmail.com',
  name: 'Darío Blanco',
  username: 'darioblanco',
};

const commonCommit = {
  author: commitAuthor,
  committer: commitAuthor,
  distinct: true,
  id: '62ec8ea713fdf14e4abaef3d7d5138194dec49ce',
  timestamp: '2020-03-02T18:17:50+01:00',
  // eslint-disable-next-line @typescript-eslint/camelcase
  tree_id: 'a241d8c2cddd2d0c2e43937631abfd23d38e76e5',
  url: 'https://commiturl',
};

describe('run', () => {
  test('render release template when commits do not have category', () => {
    const commits: Commit[] = [
      {
        ...commonCommit,
        message: 'First commit message',
      },
      {
        ...commonCommit,
        message: 'Second commit message',
      },
    ];

    (fs.readFileSync as jest.Mock).mockImplementation(
      () => `
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
    `,
    );
    expect(generateReleaseBody('mypath', 'myapp', commits)).toBe(`
# myapp release

## Changelog

- [#1](https://commiturl) First commit message **([darioblanco](https://github.com/darioblanco))**
- [#2](https://commiturl) Second commit message **([darioblanco](https://github.com/darioblanco))**

## Checklist

- [ ] Check 1
  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
    `);
  });

  test('render release template with commits by category', () => {
    const commits: Commit[] = [
      {
        ...commonCommit,
        message: 'First commit message',
      },
      {
        ...commonCommit,
        message: 'Second commit message',
      },
    ];

    (fs.readFileSync as jest.Mock).mockImplementation(
      () => `
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
    `,
    );
    expect(generateReleaseBody('mypath', 'myapp', commits)).toBe(`
# myapp release

## Changelog

- [#1](https://commiturl) First commit message **([darioblanco](https://github.com/darioblanco))**
- [#2](https://commiturl) Second commit message **([darioblanco](https://github.com/darioblanco))**

## Checklist

- [ ] Check 1
  - [ ] Check 1.2

- [ ] Check 2

## Stakeholders

- [ ] Stakeholder 1
- [ ] Stakeholder 2
    `);
  });
});
