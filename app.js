var express = require('express');
var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');

var app = express();

app.get('/', function (req, res) {
  var child;
  var command = 'tesseract -l eng 123.jpg test';
  child = exec(command, function (error, stdout, stderr) {
    // sys.print('stdout: ' + stdout);
    // sys.print('stderr: ' + stderr);
    if (error !== null) {
      return console.log('exec error: ' + error);
    } else {
      fs.readFile('test.txt', function (err, contents) {
        if(err) return res.send('FAIL');
        return res.send(contents);
      });
    }

  });

});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
