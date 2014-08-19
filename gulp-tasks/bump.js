var gulp = require('gulp');
var path = require('path');
require('shelljs/global');
/*global config, exec, cd */
config.fatal = true;

gulp.task('bump', [], function(callback) {
  var packageInfo = require('../package');
  cd(path.join(__dirname, '..'));
  exec('npm version patch');
  exec('npm test');
  if (exec('git status --porcelain ./build')) {
    // append build output
    exec('git add --all ./build');
    exec('git commit --amend --no-edit');
  }
  exec('git push');
  if (packageInfo.private) {
    console.log('private package, skipping npm publish');
    callback();
  }
  if (!packageInfo.homepage) {
    console.log('no package homepage specified, skipping npm publish');
    callback();
  }
  exec('npm publish');
  callback();
});
