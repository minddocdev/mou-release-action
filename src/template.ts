import * as fs from 'fs';

import {Commit} from '.';

/**
 * Generate a Markdown string based on commit information.
 * @param commits - The JSON array with Github commit info.
 */
function commitParser(commits: Commit[]) {
  let commitMd = '';
  commits.forEach((commit: Commit, index: number) => {
    const {username} = commit.author;
    commitMd = `${commitMd}- [#${index + 1}](${commit.url}) ${commit.message} **([${
      username
    }](https://github.com/${username}))**\n`;
  });
  return commitMd.trim();
}

export function generateReleaseBody(
  templatePath: string,
  app: string,
  commits: Commit[],
) {
  const changelogMd = commitParser(commits);
  const template = fs.readFileSync(templatePath, 'utf8');
  return template.replace(/\$APP/g, app).replace(/\$CHANGES/g, changelogMd);
}
