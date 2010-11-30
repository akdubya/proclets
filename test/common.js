var path = require('path');

require.paths.unshift(path.join(__dirname, '..', 'lib'));

var uutest = require('uutest');

exports.testDir = path.dirname(__filename);
exports.fixturesDir = path.join(exports.testDir, "fixtures");
exports.Suite = uutest.Suite;