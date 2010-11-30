var com   = require('./common'),
    p     = require('proclets'),
    fs    = require('fs');

var suite = new com.Suite();

suite.test("open process", function(assert) {
  var p1 = p.cmd('echo', ['foo']);
  var buf = '';

  p1.stdout.on('data', function(data) { buf += data });
  p1.on('exit', assert.trap(function() {
    assert.equal(buf, "foo\n");
    assert.pass();
  }));

  p1.spawn();
});

suite.test("input to process to output", function(assert) {
  var p1 = p.inp('input.txt');
  var p2 = p.cmd('grep', ['foo']);
  var p3 = p.out('process1.txt');

  p3.on('exit', function() {
    fs.readFile('process1.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "foo\n");
      assert.pass();
    }));
  });

  p1.spawn(p2.stdin);
  p2.spawn(p3.stdin);
  p3.spawn();
}, function() { fs.unlink('process1.txt') });

suite.test("process to process", function(assert) {
  var p1 = p.cmd('echo', ["foo\nbar\nbaz\n"]);
  var p2 = p.cmd('grep', ["foo"]);
  var buf = '';

  p2.stdout.on('data', function(data) { buf += data });
  p2.on('exit', assert.trap(function() {
    assert.equal(buf, "foo\n");
    assert.pass();
  }));

  p1.spawn(p2.stdin);
  p2.spawn();
});

suite.test("complex process chain", function(assert) {
  var p1 = p.inp('input.txt');
  var p2 = p.cmd('grep', ['foo', '--line-buffered']);
  var p3 = p.cmd('sed', ['s/f/F/', '-u']);
  var p4 = p.cmd('sort');
  var p5 = p.out('process2.txt');

  p5.on('exit', function() {
    fs.readFile('process2.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "Foo\n");
      assert.pass();
    }));
  });

  p1.spawn(p2.stdin);
  p2.spawn(p3.stdin);
  p3.spawn(p4.stdin);
  p4.spawn(p5.stdin);
  p5.spawn();
}, function() { fs.unlink('process2.txt') });

suite.test("open process failure", function(assert) {
  var p1 = p.cmd('echozzz', ['foo']);

  p1.on('exit', assert.trap(function(code) {
    assert.equal(code, 127);
    assert.pass();
  }));

  p1.spawn();
});

suite.test("process stderr redirection", function(assert) {
  var p1 = p.cmd('grep');
  var p2 = p.cmd('grep');
  var errStream = p.stub();

  errStream.setEncoding('utf8');
  errStream.on('data', function(data) { assert.match(data, /grep/) });
  p2.on('exit', assert.trap(function() {
    assert.ok(errStream.writable);
    assert.pass();
  }));

  p1.spawn(null, errStream);
  p1.on('exit', function() { p2.spawn(null, errStream) });
});

suite.register(module);