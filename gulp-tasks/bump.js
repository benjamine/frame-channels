var gulp = require('gulp');
var path = require('path');
require('shelljs/global');
/*global config, exec, cd, test, cp */
config.fatal = true;

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

  if (packageInfo.repository && test('-d', './pages')) {
    // update gh-pages
    if (!test('-d', './gh-pages')) {
      exec('git submodule add ' + packageInfo.repository.url + ' gh-pages');
    }
    cd('./gh-pages');
    if (exec('git rev-parse --abbrev-ref HEAD') !== 'gh-pages') {
      if (exec('git branch --list gh-pages') !== 'gh-pages') {
        exec('git checkout --orphan gh-pages');
        exec('git reset --hard');
      } else {
        exec('git checkout --force gh-pages');
      }
    }
    cp('-R', '../pages/*', './');
    cp('-R', '../build/*', './build');
    if (exec('git status --porcelain .')) {
      exec('git add --all .');
      exec('git commit --no-edit -m "version bump"');
      exec('git push');
    }
    cd('..');
  }

  exec('git push');
  exec('git push --tags');
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
