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
  if(category !== typeof(undefined))
  {
    category = category.replace(/ *, */g, "OR");
    category = category.replace(/ +/g, " AND ");
    category = category.replace(/OR/g, " OR ");
    category = category.replace(/((([\w\(\)\*]+) AND )+([\w\(\)\*]+))/g, "\($1\)");
    console.log(category);

    category = escape('(' + category + ')');
    const net = "cnn_googlenet";
    const path = util.format('/solr/core1/select?q=categoryName%3A%s%20AND%20net%3A%s&rows=%i&sort=probability%20desc', category, net, 100);

    http.get({
      hostname: 'localhost',
      port: 8983,
      path: path,
      agent: false // Create a new agent just for this one request
    }, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        const jdata = JSON.parse(data);
        if(jdata.response && jdata.response.docs)
          res.json(jdata.response.docs);
        else
          res.json([]);
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
      res.send("Error: " + err.message);
    });
  }
  else
    res.json([]);

});

app.listen(port);
