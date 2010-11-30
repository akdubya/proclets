var com   = require('./common'),
    p     = require('proclets'),
    net   = require('net'),
    fs    = require('fs');

var suite = new com.Suite();

suite.test("open socket", function(assert) {
  var p1 = p.sock('/tmp/sock1.sock');

  var server = net.createServer(function(s) {
    var buf = '';
    s.on('data', function(d) { buf += d });
    s.on('end', assert.trap(function() {
      s.end();
      assert.equal(buf, "foo");
      assert.pass();
    }));
    s.on('error', assert.trapError());
    server.on('close', function() { s.destroy() });
  });
  this.tmp.server = server;

  server.listen('/tmp/sock1.sock', function() {
    p1.spawn();
    p1.stdin.end("foo");
  });
}, function(tmp) { tmp.server.close() });

suite.test("input to socket", function(assert) {
  var p1 = p.inp('input.txt');
  var p2 = p.sock('/tmp/sock2.sock');

  var server = net.createServer(function(s) {
    var buf = '';
    s.on('data', function(d) { buf += d });
    s.on('end', assert.trap(function() {
      s.end();
      assert.equal(buf, "foo\nbar\nbaz");
      assert.pass();
    }));
    s.on('error', assert.trapError());
    server.on('close', function() { s.destroy() });
  });
  this.tmp.server = server;

  server.listen('/tmp/sock2.sock', function() {
    p1.spawn(p2.stdin);
    p2.spawn();
  });
}, function(tmp) { tmp.server.close() });

suite.test("socket to output", function(assert) {
  var p1 = p.sock('/tmp/sock3.sock');
  var p2 = p.out('socket.txt');

  var echo = net.createServer(function(s) {
    s.on('data', function(d) { s.write(d + "bar") });
    s.on('error', assert.trapError());
    echo.on('close', function() { s.destroy() });
  });
  this.tmp.echo = echo;

  echo.listen('/tmp/sock3.sock', function() {
    p1.spawn(p2.stdin);
    p2.spawn();
    p1.stdin.end("foo");
  });

  p2.on('exit', function() {
    fs.readFile('socket.txt', 'utf8', assert.trap(function(err, data) {
      assert.ifError(err);
      assert.equal(data, "foobar");
      assert.pass();
    }));
  });
}, function(tmp) { tmp.echo.close(); fs.unlink('socket.txt') });

suite.test("socket to process", function(assert) {
  var p1 = p.sock('/tmp/sock4.sock');
  var p2 = p.cmd('sort');
  var buf = '';

  var echo = net.createServer(function(s) {
    s.on('data', function(d) { s.write(d) });
    s.on('error', assert.trapError());
    echo.on('close', function() { s.destroy() });
  });
  this.tmp.echo = echo;

  echo.listen('/tmp/sock4.sock', function() {
    p1.spawn(p2.stdin);
    p2.spawn();
    p1.stdin.write("foo\n");
    p1.stdin.write("bar\n");
    p1.stdin.end("baz");
  });

  p2.stdout.on('data', function(data) { buf += data });
  p2.on('exit', assert.trap(function() {
    assert.equal(buf, "bar\nbaz\nfoo\n");
    assert.pass();
  }));
}, function(tmp) { tmp.echo.close() });

suite.test("process to socket", function(assert) {
  var p1 = p.cmd('echo', ['foo']);
  var p2 = p.sock('/tmp/sock5.sock');

  var server = net.createServer(function(s) {
    var buf = '';
    s.on('data', function(d) { buf += d });
    s.on('end', assert.trap(function() {
      s.end();
      assert.equal(buf, "foo\n");
      assert.pass();
    }));
    s.on('error', assert.trapError());
    server.on('close', function() { s.destroy() });
  });
  this.tmp.server = server;

  server.listen('/tmp/sock5.sock', function() {
    p1.spawn(p2.stdin);
    p2.spawn();
  });
}, function(tmp) { tmp.server.close() });

suite.test("socket stderr redirection", function(assert) {
  var p1 = p.sock('/tmp/bogus.sock');
  var errStream = p.stub();

  errStream.setEncoding('utf8');
  errStream.on('data', assert.trap(function(data) {
    assert.match(data, /^Error: ENOENT/);
    assert.pass();
  }));

  p1.spawn(null, errStream);
});

suite.register(module);