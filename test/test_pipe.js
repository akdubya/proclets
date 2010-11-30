var com   = require('./common'),
    p     = require('proclets'),
    fs    = require('fs');

var suite = new com.Suite();

suite.test("open pipe", function(assert) {
  var p1 = p.pipe([
    p.wrap(p.stub()),
    p.wrap(p.stub()),
    p.wrap(p.stub())
  ]);
  var buf = '';

  p1.stdout.on('data', function(data) { buf += data });
  p1.on('exit', assert.trap(function() {
    assert.equal(buf, "foobarbaz");
    assert.pass();
  }));

  p1.spawn();

  p1.stdin.write("foo");
  p1.stdin.write("bar");
  p1.stdin.end("baz");
});

suite.test("pipe binding", function(assert) {
  var p1 = p.inp('input.txt')
  var p2 = p.pipe([
    p.wrap(p.stub()),
    p.wrap(p.stub()),
    p.wrap(p.stub())
  ]);
  var p3 = p.out('pipe.txt')

  p3.on('exit', function() {
    fs.readFile('pipe.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "foo\nbar\nbaz");
      assert.pass();
    }));
  });

  p1.spawn(p2.stdin);
  p2.spawn(p3.stdin);
  p3.spawn();
}, function() { fs.unlink('pipe.txt') });

suite.test("pipe stderr redirection", function(assert) {
  var p1 = p.pipe([
    p.inp('bogus.txt'),
    p.wrap(p.stub())
  ]);
  var errStream = p.stub();
  errStream.setEncoding('utf8');

  errStream.on('data', assert.trap(function(data) {
    assert.match(data, /^Error: ENOENT/);
    assert.pass();
  }));

  p1.spawn(null, errStream);
});

suite.register(module);