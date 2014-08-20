var gulp = require('gulp');
var path = require('path');
require('shelljs/global');
/*global config, exec, cd */
config.fatal = true;

var ghPages = require('./util/gh-pages');

gulp.task('bump', [], function(callback) {
  var packageInfo = require('../package');
  cd(path.join(__dirname, '..'));

  // version bump
  exec('npm version patch');

  // test
  exec('npm test');
  if (exec('git status --porcelain ./build')) {
    // update /build
    exec('git add --all ./build');
    exec('git commit --amend --no-edit');
  }

  ghPages.publish();

  exec('git push origin');
  exec('git push --tags origin');
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
