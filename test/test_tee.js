var com   = require('./common'),
    p     = require('proclets');

var suite = new com.Suite();

suite.test("open tee", function(assert) {
  var c1 = p.wrap(p.stub());
  var c2 = p.wrap(p.stub());
  var p1 = p.tee([c1, c2]);
  var buf1 = buf2 = buf3 = '';

  c1.stdout.on('data', function(data) { buf1 += data });
  c2.stdout.on('data', function(data) { buf2 += data });
  p1.stdout.on('data', function(data) { buf3 += data });
  p1.on('exit', assert.trap(function() {
    assert.equal(buf1, "foo");
    assert.equal(buf2, "foo");
    assert.equal(buf3, "foo");
    assert.pass();
  }));

  p1.spawn();

  p1.stdin.end("foo");
});

suite.test("wrapper to tee to wrapper", function(assert) {
  var c1 = p.wrap(p.stub());
  var c2 = p.wrap(p.stub());
  var p1 = p.wrap(p.stub());
  var p2 = p.tee([c1, c2]);
  var p3 = p.wrap(p.stub());
  var buf1 = buf2 = buf3 = '';

  c1.stdout.on('data', function(data) { buf1 += data });
  c2.stdout.on('data', function(data) { buf2 += data });
  p3.stdout.on('data', function(data) { buf3 += data });
  p3.on('exit', assert.trap(function() {
    assert.equal(buf1, "foo");
    assert.equal(buf2, "foo");
    assert.equal(buf3, "foo");
    assert.pass();
  }));

  p1.spawn(p2.stdin);
  p2.spawn(p3.stdin);
  p3.spawn();

  p1.stdin.end("foo");
});

suite.test("process to tee to process", function(assert) {
  var c1 = p.wrap(p.stub());
  var p1 = p.cmd('echo', ["foo\nbar\nbaz"]);
  var p2 = p.tee([c1]);
  var p3 = p.cmd('grep', ["foo"]);
  var buf1 = buf2 = '';

  c1.stdout.on('data', function(data) { buf1 += data });
  p3.stdout.on('data', function(data) { buf2 += data });
  p3.on('exit', assert.trap(function() {
    assert.equal(buf1, "foo\nbar\nbaz\n");
    assert.equal(buf2, "foo\n");
    assert.pass();
  }));

  p1.spawn(p2.stdin);
  p2.spawn(p3.stdin);
  p3.spawn();
});

suite.test("tee stderr redirection", function(assert) {
  var c1 = p.sock('/tmp/bogus.sock');
  var p1 = p.tee([c1]);
  var errStream = p.stub();

  errStream.setEncoding('utf8');
  errStream.on('data', assert.trap(function(data) {
    assert.match(data, /^Error: ENOENT/);
    assert.pass();
  }));

  p1.spawn(null, errStream);
});

suite.register(module);