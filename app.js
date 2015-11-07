var express = require('express');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var https = require('https');
var fs = require('fs');
var shortid = require('shortid');
var multer = require('multer');

var jpeg = require('jpeg-js');

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

function makeBinaryImage(fileName, cb){
  var jpegData = fs.readFileSync(fileName);
  var rawImageData = jpeg.decode(jpegData);
  var histogram = [];
  for(var i = 0; i < 256; i++) histogram[i] = 0;
  var count = 0;
  for(var h = 0; h < rawImageData.height; h++){
    for(var w = 0; w < rawImageData.width; w++){
      var avg = 0;
      avg += rawImageData.data[count];
      avg += rawImageData.data[count+1];
      avg += rawImageData.data[count+2];
      avg += rawImageData.data[count+3];
      avg = Math.floor(avg / 4);
      if(histogram[avg]){
        histogram[avg]++;
      }else{
        histogram[avg] = 1;
      }
      count+=4;
    }
  }

  //Best threshold
  var start = 0;
  var end = histogram.length - 1;
  var left = 0;
  var right = 0;
  while(start < end) {
    if(left < right) {
      //More information on right side, add weight to left
      left += histogram[start];
      start++;
    }else if(left > right){
      //More information on left side, add weight to right
      right += histogram[end];
      end--;
    }else{
      //Both equal, don't bother adding since they're equal
      start++;
      end--;
    }
  }

  count = 0;
  for(var h = 0; h < rawImageData.height; h++){
    for(var w = 0; w < rawImageData.width; w++){
      var avg = 0;
      avg += rawImageData.data[count];
      avg += rawImageData.data[count+1];
      avg += rawImageData.data[count+2];
      avg += rawImageData.data[count+3];
      avg = Math.floor(avg / 4);
      if(avg < start){
        rawImageData.data[count] = 0;
        rawImageData.data[count+1] = 0;
        rawImageData.data[count+2] = 0;
        rawImageData.data[count+3] = 0;
      }else{
        rawImageData.data[count] = 255;
        rawImageData.data[count+1] = 255;
        rawImageData.data[count+2] = 255;
        rawImageData.data[count+3] = 255;
      }
      count+=4;
    }
  }

  var jpegImageData = jpeg.encode(rawImageData, 50);

  var file = fs.createWriteStream(fileName);
  file.write(jpegImageData.data);
  file.end();
  cb();
}

function runTesseract(fileName, cb){
  var child;
  var command = "tesseract -l eng " + fileName + " stdout";
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
  var fileName = file.path;
  makeBinaryImage(fileName, function(){
    runTesseract(fileName, function(text){
      res.send(text);
    });
  });
});

app.get('/', function (req, res) {
  return res.sendFile(__dirname + '/views/index.html');
});

app.get('/url', function (req, res) {
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
          makeBinaryImage(fileName, function(){
            runTesseract(fileName, function(text){
              res.send(text);
            });
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
