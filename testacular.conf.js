// Testacular configuration
// Generated on Thu Nov 22 2012 15:43:18 GMT-0300 (ART)


// base path, that will be used to resolve files and exclude
basePath = '.';


// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,
  'lib/jasmine-jquery.js',
  'lib/jquery.js',
  'lib/jquery.ui.js',
  'src/jquery.hipp.grid.js',
  'test/*.js',
  //'spec/javascripts/fixtures/*.html'
];


// list of files to exclude
exclude = [
  
];


proxies = {
'/fixtures' : 'http://localhost:7777/'
};

// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['dots'];


// web server port
port = 9999;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 5000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
