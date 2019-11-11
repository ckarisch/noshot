const http = require('http');
var express = require('express');
var app = express();
var util = require('util');
var querystring = require('querystring');
var fs = require('fs');

var solr = require('solr-client');
var client = solr.createClient({
    host: '127.0.0.1',
    port: '8983',
    core: 'core1',
    protocol: 'http'
});

const hostname = '127.0.0.1';
const port = 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/search/:net/:category', function userIdHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  let net = req.params.net;
  let category = req.params.category;
  if(category !== typeof(undefined))
  {
    category = category.replace(/ *, */g, "OR");
    category = category.replace(/ +/g, " AND ");
    category = category.replace(/OR/g, " OR ");
    category = category.replace(/((([\w\(\)\*]+) AND )+([\w\(\)\*]+))/g, "\($1\)");
    console.log(category);

    category = escape('(' + category + ')');
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


function deleteOldCache(client) {
  var query = 'nodeType:10';
  client.deleteByQuery(query,function(err,obj){
     if(err){
     	console.log(err);
     }else{
     	console.log("cache cleared");
     }
  });
}


function deleteAll(client) {
  var query = '*:*';
  client.deleteByQuery(query,function(err,obj){
     if(err){
     	console.log(err);
     }else{
     	console.log("all data cleared");
     }
  });
}

function fetch_solr_page($page_number, $rows_per_page) {
  $start = $page_number * $rows_per_page
  $params = [ q = $some_query, rows = $rows_per_page, start = $start ]
  return fetch_solr($params)
}


function getLimit(client, parameter, query) {
  return new Promise((resolve, reject) => {
    let sort = {};
    sort[parameter] = 'desc';

    if(typeof query === 'undefined') {
      query = '*:*';
    }

    var query = client.createQuery()
    				   .q(query)
               .sort(sort)
    				   .start(0)
    				   .rows(1);

    client.search(query, (err, obj) => {
      if(err) { reject(err) }
      else {
        resolve(obj.response.docs[0]);
      }
    });
  });
}

function getBestKeyframe(client, video, startSecond, endSecond, categoryId, callback) {
  return new Promise((resolve, reject) => {
    var query = client.createQuery()
    				   .q(util.format('nodeType:1 AND video:%i AND second:[%i TO %i] AND category:%i', video, startSecond, endSecond, categoryId))
               .sort({'probability': 'desc'})
               .start(0)
    				   .rows(1);

    client.search(query,(err, obj) => {
      if(err) reject(err)
      else {
        let bestKeyframe = obj.response.docs[0];

        if(typeof bestKeyframe === 'undefined')
        {
          return resolve(null);
        }

        bestKeyframe.startSecond = startSecond;
        bestKeyframe.endSecond = endSecond;
        bestKeyframe.nodeType= 10;
        delete bestKeyframe.id;
        delete bestKeyframe._version_;

        resolve(bestKeyframe);
      }
    });
  });
}

function generateDemoData(client, res) {
  deleteAll(client);

  categories = {'person': 0, 'umbrella': 25, 'cow': 19};
  let data = [];
  for (category in categories) {
    for (let v = 1; v< 10; v++){
      for (let i = 1; i< 30; i++){
        data.push({ nodeType : 1, probability: (i%10)/10, startSecond: i, endSecond: i, video: v, second: i, net: 'google_yolo', count: 1, category: categories[category], categoryName: category });
      }
    }
  }
  client.add(data,function(err,obj){
     if(err){
        console.log(err);
     }else{
        console.log('Solr response:', obj);
        client.commit();
        return res.json("done");
     }
  });
}

app.get('/update', async function userIdHandler(req, res) {
  res.statusCode = 200;
  //res.setHeader('Content-Type', 'application/json');

  client.autoCommit = true;

  deleteOldCache(client);
  // return generateDemoData(client, res);


  let videos = (await getLimit(client, 'video')).video;
  let categories = (await getLimit(client, 'category')).category;
  let data = [];
  let datacounter = 0;

  // console.log("videos: " + videos);
  for (let video = 1; video <= videos; video++) {
    for (let category = 0; category <= categories; category++) {
      let bestKeyframe = await getBestKeyframe(client, video, 1, 10, category);
      if(bestKeyframe)
        data.push(bestKeyframe);
    }
  }

  console.log(data);

  client.add(data,function(err3,obj3){
    if(err3){
     console.log(err3);
    }else{
      console.log("resp:")
      client.commit();
      res.json("done: " + data.length + " Objects cached.");
    }

  });

});


app.listen(port);
