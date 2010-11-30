var util = require('util'),
    fs   = require('fs'),
    netBinding = process.binding('net');

exports.inherits = util.inherits;

exports.sendfile = function(src, dest, cb) {
  var size = 1 << 10, offset = 0;

  function sendData() {
    fs.sendfile(dest, src, offset, size, function(err, written) {
      if (err) {
        if (err.errno !== process.binding('constants').EAGAIN) {
          cb(err);
        } else {
          sendData();
        }
        return;
      }
      offset += written;
      (written > 0) ? sendData() : cb();
    });
  }

  sendData();
};

exports.pump = function(src, dest, options) {
  src.on('data', function(chunk) {
    if (dest.write(chunk) === false) src.pause();
  });
  dest.on('drain', function() {
    if (src.readable) src.resume();
  });
  if (!options || options.end !== false) {
    src.on('end', function() {
      dest.end()
    });
  }
  // TODO: safe resumes for all streams
  src.paused && src.resume();
};

var transports = {
  stream_stream: exports.pump,

  file_file: function(src, dest) {
    openStreams([src, dest], function() {
      sendfile(src, dest);
    });
  },

  file_socket: function(src, dest) {
    openStreams([src, dest], function() {
      sendfile(src, dest);
    });
  },

  file_pipein: function(src, dest) {
    dest.fd = null;
    dest.on('close', function() { src.destroy() });
    openStreams([src], function() {
      dest.fd = src.fd;
      dest.emit('ready');
    });
  },

  socket_pipein: function(src, dest) {
    dest.fd = null;
    dest.on('close', function() { src.destroy() });
    openStreams([src], function() {
      src.pause();
      dest.fd = src.fd;
      dest.emit('ready');
    });
  },

  pipeout_socket: function(src, dest) {
    src.fd = null;
    src.on('close', function() { dest.end() });
    openStreams([dest], function() {
      src.fd = dest.fd;
      src.emit('ready');
    });
  },

  pipeout_file: function(src, dest) {
    src.fd = null;
    src.on('close', function() { dest.end() });
    openStreams([dest], function() {
      src.fd = dest.fd;
      src.emit('ready');
    });
  },

  pipeout_pipein: function(src, dest) {
    var pipefds = netBinding.pipe();
    src.fd = pipefds[1];
    dest.fd = pipefds[0];
    src.once('fork', function() { netBinding.close(pipefds[1]) });
    dest.once('fork', function() { netBinding.close(pipefds[0]) });
  }
};

function openStreams(streams, cb) {
  var pending = 0;
  function _check() {
    if (--pending) return;
    cb();
  }

  streams.forEach(function(stream) {
    if (stream.fd !== null) return;
    switch (inferStreamType(stream)) {
      case 'file':
        pending++;
        stream.on('open', _check);
        break;
      case 'socket':
        pending++;
        stream.on('connect', _check);
    }
  });

  if (!pending) cb();
}

exports.openStreams = openStreams;

function inferStreamType(stream) {
  if (stream.fd === undefined) return 'stream';
  if (stream.path !== undefined) return 'file';
  if (stream.type === 'pipein') return 'pipein';
  if (stream.type === 'pipeout') return 'pipeout';
  return 'socket';
}

exports.inferStreamType = inferStreamType;

exports.pipe = function(src, dest, options) {
  var left = inferStreamType(src);
  var right = inferStreamType(dest);
  var types = left + '_' + right;
  var fn = transports[types] || transports.stream_stream;
  fn(src, dest, options);
};

function sendfile(src, dest) {
  exports.sendfile(src.fd, dest.fd, function(err) {
    if (err) {
      src.readable = false;
      return;
    }
    src.emit('end');
    src.destroy();
    if (dest && dest.writable) dest.end();
  });
}