var com   = require('./common'),
    p     = require('proclets'),
    net   = require('net'),
    fs    = require('fs');

var suite = new com.Suite();

suite.test("open output", function(assert) {
  var p1 = p.out('output1.txt');

  p1.on('exit', function() {
    fs.readFile('output1.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "fuzzfoof");
      assert.pass();
    }));
  });

  p1.spawn();

  p1.stdin.write('fuzz');
  p1.stdin.end('foof');
}, function() { fs.unlink('output1.txt') });

suite.test("pipelet to output", function(assert) {
  var p1 = p.wrap(p.stub());
  var p2 = p.out('output2.txt');

  p2.on('exit', function() {
    fs.readFile('output2.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "fuzzfoof");
      assert.pass();
    }));
  });

  p1.spawn(p2.stdin);
  p2.spawn();

  p1.stdin.write('fuzz');
  p1.stdin.end('foof');
}, function() { fs.unlink('output2.txt') });

suite.test("process to output", function(assert) {
  var p1 = p.cmd('echo', ['foo']);
  var p2 = p.out('output3.txt');

  p2.on('exit', function() {
    fs.readFile('output3.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "foo\n");
      assert.pass();
    }));
  });

  p1.spawn(p2.stdin);
  p2.spawn();
}, function() { fs.unlink('output3.txt') });

suite.test("output stderr redirection", function(assert) {
  var p1 = p.out('output4.txt');
  var errStream = p.stub();

  errStream.setEncoding('utf8');
  errStream.on('data', assert.trap(function(data) {
    assert.match(data, /^ERROR/);
    assert.pass();
  }));

  p1.spawn(null, errStream);

  p1.stdin.emit('error', 'ERROR');
}, function() { fs.unlink('output4.txt') });

suite.register(module);