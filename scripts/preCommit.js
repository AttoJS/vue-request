/* eslint-disable @typescript-eslint/no-var-requires */
const simpleGit = require('simple-git');
const git = simpleGit();
git.diff({ '--name-only': true, '--staged': true }).then(res => {
  const files = res.split('\n').filter(Boolean);
  // disallow commit examples folder
  const status = files.some(file => file.startsWith('examples/'));
  if (status) {
    console.error('\n✖   Do not commit the "examples" folder \n');
    process.exit(1);
  }
  process.exit(0);
});
