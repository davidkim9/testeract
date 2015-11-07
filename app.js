var express = require('express');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var fs = require('fs');

var app = express();

app.get('/', function (req, res) {
  var fileName = "tempFile.jpg";

  var file = fs.createWriteStream(fileName);
  console.log("Requesting");
  var request = http.get("http://www.codeproject.com/KB/recipes/OCR-Chain-Code/image012.jpg", function(response) {
    console.log("Request");
    response.on('data', function(data) {
        file.write(data);
    }).on('end', function() {
        file.end();
        console.log("Download complete!");
        var child;
        var command = "tesseract " + fileName + " stdout";
        child = exec(command, function (error, stdout, stderr) {
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
          console.log("Tesseract complete!");
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          res.send(stdout);
        });
    });
  });
});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
