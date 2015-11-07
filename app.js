var express = require('express');
var sys = require('sys')
var exec = require('child_process').exec;

var app = express();

app.get('/', function (req, res) {
  var child;
  var command = 'tesseract -l eng 123.jpg test';
  child = exec(command, function (error, stdout, stderr) {
    // sys.print('stdout: ' + stdout);
    // sys.print('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    res.send('Hello World!' + stdout + error + stderr);
  });
});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});