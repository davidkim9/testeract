var express = require('express');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var https = require('https');
var fs = require('fs');
var shortid = require('shortid');

var app = express();

app.get('/', function (req, res) {
  //http://testeract.herokuapp.com/?url=http://www.codeproject.com/KB/recipes/OCR-Chain-Code/image012.jpg
  var url = req.query.url;
  try{
    var fileName = "./uploads/t_" + shortid.generate() + ".jpg";
    
    var file = fs.createWriteStream(fileName);
    var cb = function(response) {
      response.on('data', function(data) {
          file.write(data);
      }).on('end', function() {
          file.end();
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
    }
    if(url.indexOf("https://") == 0){
      https.get(url, cb);
    }else{
      http.get(url, cb);
    }
  }catch(e){
    res.send("Something exploded: ", e);
  }
});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
