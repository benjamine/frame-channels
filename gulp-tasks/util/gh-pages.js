var path = require('path');
require('shelljs/global');
/*global config, exec, cd, test, cp */
config.fatal = true;

function publish(){
  var packageInfo = require('../../package');
  cd(path.join(__dirname, '../..'));
  if (packageInfo.repository && test('-d', './pages')) {
    // update/create github page
    if (!test('-d', './gh-pages')) {
      console.log('creating submodule for gh-pages');
      exec('git submodule add --force ' + packageInfo.repository.url + ' gh-pages');
      console.log('submodule created');
    }
    cd('./gh-pages');
    if (exec('git symbolic-ref --short HEAD').output !== 'gh-pages\n') {
      if (!exec('git branch --list gh-pages').output) {
        console.log('creating gh-pages branch');
        exec('git checkout --orphan gh-pages');
        exec('git reset --hard');
      } else {
        console.log('checking out gh-pages');
        exec('git checkout gh-pages');
      }
    }
    cp('-Rf', '../pages/*', './');
    cp('-Rf', '../build/*', './build');
    cp('-Rf', '../test/index.html', './test');
    if (exec('git status --porcelain .').output) {
      console.log('updating gh-pages');
      exec('git add --all .');
      exec('git commit --no-edit -m "version bump"');
      exec('git push');
    }
    cd('..');
    if (exec('git status --porcelain ./gh-pages').output) {
      exec('git add --all ./gh-pages');
      exec('git add --all .gitmodules');
      exec('git commit --no-edit -m "update gh-pages"');
    }
  }
}

exports.publish = publish;
