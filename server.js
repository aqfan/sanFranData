'use-strict';

const express = require('express');
const app = express();
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');


var data = {};
function getData() {
  var file = fs.createReadStream('./data/data.csv');
  Papa.parse(file, {
    header: true,
    download: true,
    dynamicTyping: true,
    complete: function(results) {
      console.log("yes");
      data = results["data"];
    }
  });
}

app.listen(5000, function() {
  getData();
});

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/map', function(req, res) {
  res.sendFile(path.join(__dirname, '/heatmap.html'));
});

app.get('/data', function(req, res) {
  res.send(data)
});
