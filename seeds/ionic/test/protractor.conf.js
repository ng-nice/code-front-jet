exports.config = {
  multiCapabilities: [
    {
      'browserName': 'phantomjs',
      'phantomjs.binary.path': require('phantomjs').path,
      'phantomjs.ghostdriver.cli.args': ['--loglevel=DEBUG']
    },
    //{
    //  'browserName': 'chrome'
    //},
    //{
    //  'browserName': 'firefox'
    //},
    //{
    //  'browserName': 'ie'
    //}
  ]
};
