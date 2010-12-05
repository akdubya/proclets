var com   = require('./common'),
    p     = require('proclets'),
    net   = require('net'),
    fs    = require('fs');

var suite = new com.Suite();

suite.test("open input", function(assert) {
  var p1 = p.inp('input.txt');
  var buf = '';

  p1.stdout.on('data', function(data) { buf += data });
  p1.on('exit', assert.trap(function() {
    assert.ok(p1.stdout.stats === undefined);
    assert.equal(buf, "foo\nbar\nbaz");
    assert.pass();
  }));

  p1.spawn();
});

suite.test("open input with stat", function(assert) {
  var p1 = p.inp('input.txt', {stat: true});
  var buf = '';

  p1.stdout.on('data', function(data) { buf += data });
  p1.on('exit', assert.trap(function() {
    assert.ok(p1.stdout.stats !== undefined);
    assert.equal(buf, "foo\nbar\nbaz");
    assert.pass();
  }));

  p1.spawn();
});

suite.test("input to proclet", function(assert) {
  var p1 = p.inp('input.txt');
  var p2 = p.wrap(p.stub());
  var buf = '';

  p1.stdout.on('data', function(data) { buf += data });
  p2.on('exit', assert.trap(function() {
    assert.equal(buf, "foo\nbar\nbaz");
    assert.pass();
  }));

  p1.spawn(p2.stdin);
  p2.spawn();
});

suite.test("input to process", function(assert) {
  var p1 = p.inp('input.txt');
  var p2 = p.cmd('sort');
  var buf = '';

  p2.stdout.on('data', function(data) { buf += data });
  // Testing p1 exit here
  p1.on('exit', assert.trap(function() {
    assert.equal(buf, "bar\nbaz\nfoo\n");
    assert.pass();
  }));

  p1.spawn(p2.stdin);
  p2.spawn();
});

suite.test("input to output", function(assert) {
  var p1 = p.inp('input.txt');
  var p2 = p.out('output.txt');

  p2.on('exit', function() {
    fs.readFile('output.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "foo\nbar\nbaz");
      assert.pass();
    }));
  });

  p1.spawn(p2.stdin);
  p2.spawn();
}, function() { fs.unlink('output.txt') });

suite.test("input stderr redirection", function(assert) {
  var p1 = p.inp('bogus.txt');
  var errStream = p.stub();

  errStream.setEncoding('utf8');
  errStream.on('data', assert.trap(function(data) {
    assert.match(data, /^Error: ENOENT/);
    assert.pass();
  }));

  p1.spawn(null, errStream);
});

suite.register(module);