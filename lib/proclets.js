var Input   = require('./input').Input,
    Output  = require('./output').Output,
    Wrapper = require('./wrapper').Wrapper,
    Process = require('./process').Process,
    Socket  = require('./socket').Socket,
    Pipe    = require('./pipe').Pipe;
    Tee     = require('./tee').Tee;
    Stub    = require('./stub').Stub;
    Stdin   = require('./stdin').Stdin;
    Stdout  = require('./stdout').Stdout;

exports.inp = function(path, options) {
  return new Input(path, options);
};
exports.out = function(path, options) {
  return new Output(path, options);
};
exports.sock = function(port, host, options) {
  return new Socket(port, host, options);
};
exports.wrap = function(stream, options) {
  return new Wrapper(stream, options);
};
exports.cmd = function(cmd, args, options) {
  return new Process(cmd, args, options);
};
exports.pipe = function(queue, options) {
  return new Pipe(queue, options);
};
exports.tee = function(procs, options) {
  return new Tee(procs, options);
};
exports.stub = function() {
  return new Stub();
};
exports.stdin = function() {
  return new Stdin();
};
exports.stdout = function() {
  return new Stdout();
};

exports.spawnPipe = function(queue, errStream, options) {
  var pipe = exports.pipe(queue, options);
  if (errStream) {
    pipe.on('exit', function() { errStream.end() });
  }
  pipe.spawn(errStream);
  return pipe;
};