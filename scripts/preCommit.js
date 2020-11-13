/* eslint-disable @typescript-eslint/no-var-requires */
const simpleGit = require('simple-git');
const git = simpleGit();
git.diff({ '--name-only': true, '--staged': true }).then(res => {
  const files = res.split('\n').filter(Boolean);
  // disallow commit example folder
  const status = files.some(file => file.startsWith('example/'));
  if (status) {
    console.error('\n✖   Do not commit the "example" folder \n');
    process.exit(1);
  }
  process.exit(0);
});
