var com   = require('./common'),
    p     = require('proclets');

var suite = new com.Suite();

suite.test("open wrapper", function(assert) {
  var p1 = p.wrap(p.stub());
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

suite.test("wrapper pipeline", function(assert) {
  var p1 = p.wrap(p.stub());
  var p2 = p.wrap(p.stub());
  var p3 = p.wrap(p.stub());
  var buf = '';

  p3.stdout.on('data', function(data) { buf += data });
  p3.on('exit', assert.trap(function() {
    assert.equal(buf, "foobarbaz");
    assert.pass();
  }));

  p1.spawn(p2.stdin);
  p2.spawn(p3.stdin);
  p3.spawn();

  p1.stdin.write("foo");
  p1.stdin.write("bar");
  p1.stdin.end("baz");
});

suite.test("wrapper stderr redirection", function(assert) {
  var p1 = p.wrap(p.stub());
  var p2 = p.wrap(p.stub());
  var errStream = p.stub();
  var buf = '';

  errStream.on('data', function(data) { buf += data });
  p2.on('exit', assert.trap(function() {
    assert.equal(buf, "foobar");
    assert.pass();
  }));

  p1.spawn(p2.stdin, errStream);
  p2.spawn(null, errStream);

  p1._stream.emit('error', "foo");
  p2._stream.emit('error', "bar");

  p1.stdin.end();
});

suite.register(module);