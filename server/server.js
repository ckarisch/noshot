const http = require('http');
var express = require('express');
var app = express();
var util = require('util');

const hostname = '127.0.0.1';
const port = 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/category/:category?', function userIdHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  let category = req.params.category;
  let net = "cnn_googlenet";

  http.get({
    hostname: 'localhost',
    port: 8983,
    path: util.format('/solr/core1/select?q=net%3A%s%20AND%20category%3A%s&rows=%i&sort=probability%20desc', net, category, 100),
    agent: false // Create a new agent just for this one request
  }, (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      let docs = JSON.parse(data).response.docs;
      res.json(docs);
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
    res.send("Error: " + err.message);
  });

});

app.listen(port);
