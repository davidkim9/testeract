var express = require('express');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var https = require('https');
var fs = require('fs');
var shortid = require('shortid');
var multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.jpg') //Appending .jpg
  }
})

var upload = multer({ storage: storage })

var app = express();

function runTesseract(fileName, cb){
  var child;
  var command = "tesseract " + fileName + " stdout";
  console.log("Running command: " + command);
  child = exec(command, function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    console.log("Tesseract complete!");
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    cb(stdout);
  });
}

app.post('/upload', upload.single('image'), function(req, res){
  var file = req.file;
  runTesseract(file.path, function(text){
    res.send(text);
  });
  console.log(req.body, req.file);
  // return res.send("UPLOAD REQUEST");
});

app.get('/', function (req, res) {
  return res.sendFile(__dirname + '/views/index.html');
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
          runTesseract(fileName, function(text){
            res.send(text);
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
