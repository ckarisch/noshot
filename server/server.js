const http = require('http');
var express = require('express');
var app = express();
var util = require('util');
var querystring = require('querystring');
var fs = require('fs');
const url = require('url');
const cacheUpdateSemaphore = require('semaphore')(1)
var convertSeconds = require('convert-seconds');

let keyCount = require('../noshot/public/config/keyCount.json');

var solr = require('solr-client');
var client = solr.createClient({
    host: '127.0.0.1',
    port: '8983',
    core: 'noshot',
    protocol: 'http'
});

const hostname = '127.0.0.1';
const port = 3001;
const treefileName = '9k.tree';
const namesfileName = '9k.names';
let cacheRunning = false;

const categoryNames = parseNamesFile(namesfileName);
const categoryTree = parseTreeFile(treefileName);
const categoryIdTree = categoryTree.map(a => a[1]); // only ids
const categoryChildrenArray = generateChildrenArray();

String.prototype.replaceArray = function(find, replace) {
  var replaceString = this;
  var regex;
  for (var i = 0; i < find.length; i++) {
    regex = new RegExp(find[i], "g");
    replaceString = replaceString.replace(regex, replace[i]);
  }
  return replaceString;
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/search/:net/:category/:cache', function searchHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  let net = req.params.net;
  let category = req.params.category;
  let cache = req.params.cache;
  if(category !== typeof(undefined))
  {
    // category = category.replace(/ *, */g, "OR");
    // category = category.replace(/ +/g, " AND ");
    // category = category.replace(/OR/g, " OR ");
    // category = category.replace(/((([\w\(\)\*]+) AND )+([\w\(\)\*]+))/g, "\($1\)");
    // console.log(category);
    //
    // category = escape('(' + category + ')');
    // const path = util.format('/solr/noshot/select?q=categoryName%3A%s%20AND%20net%3A%s%20AND%20nodeType%3A%s&rows=%i&sort=probability%20desc', category, net, cache, 1000);



    categoryId = searchStringInArray(categoryNames, category) // search category and get id;
    let children = [];
    if (categoryId.length > 0)
      children = categoryChildrenArray[categoryId[0]]; // get childs

    console.log(children);

    // add searched category
    children.push(categoryId[0]);
    const solrGetUrl = new url.URL('http://' + hostname + ':8983/solr/noshot/select');

    let categoryString = '';
    for (let c of children) {
      if (categoryString != '')
        categoryString += ' OR ';
      categoryString += c;
    }

        //const queryItems = [['categoryName', category], ['net', net], ['nodeType', cache]];
        const queryItems = [
            ['category', '(' + categoryString + ')'],
            ['net', net],
            ['nodeType', cache]
        ];
        let q = '';
        for (let e of queryItems) {
            if (q != '')
                q += ' AND ';
            q += e[0] + ':' + e[1];
        }
        q = q.replaceArray([' ', ':'], ['+', '%3A']);

        // const params = util.format('&rows=%i&sort=probability%20desc&group=true&group.field=video&group.main=true', 1000);
        const params = util.format('&sort=probability%20desc&rows=%i', 200);


        http.get({
            hostname: 'localhost',
            port: 8983,
            path: '/solr/noshot/select?q=' + q + params,
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
                if (jdata.response && jdata.response.docs)
                    res.json(filterSolrResponse(jdata.response.docs));
                else
                    res.json([]);
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
            res.send("Error: " + err.message);
        });
    } else
        res.json([]);

});

function searchStringInArray(array, search){
  return array.map(s => s.toLowerCase() == search.toLowerCase() ? array.indexOf(s): null).filter(element => element !== null);
}

// remove duplicate keyframes from solr resonse. Entries are identified by id field.
function filterSolrResponse(docs) {
  const result = Object.values(docs.reduce( (acc, obj) => {
      const prev = acc[obj.UserID];
      const id = obj.video + '_' + obj.second;
      if (!prev || !acc[id]) {
          acc[id] = obj;
      }
      return acc;
  }, {}));

  // HOT FIX

  for(let i = 0; i < result.length; i++) {
    result[i].categoryName = getCategoryName(result[i].category);

    // let children = getChildren(result[i].category)
    // let childNames = [];
    // for(let c of children) {
    //   childNames.push(getCategoryName(c));
    // }
    result[i].parentName = getCategoryName(result[i].parentCategory);
    // result[i].childs = children.length;
  }

  // END HOT FIX

  return result;
}

function getCategoryName(id) {
  return categoryNames[id];
}


function getChildren(id) {

  // get direct child categories
  childCategories = categoryTree.map(c => c[1] == id ? categoryTree.indexOf(c) : null).filter(e => e !== null);
  // console.log(childCategories);

  if(childCategories.length == 0)
    return childCategories;

  let children = childCategories;

  for (c of childCategories) {
    children = children.concat(getChildren(c));
  }
  return children.slice(0,1000);

}

function generateChildrenArray() {
  childrenArray = [];

  console.log("generating children array");
  for (let i = 0; i < categoryTree.length; i++) {
    childrenArray[i] = getChildren(i);
  }
  console.log("done");
  return childrenArray;
}

function parseNamesFile(namesfileName) {
  const namesString = fs.readFileSync(namesfileName, 'utf8');
  const names = namesString.split(/\r?\n/);
  return names;
}

function parseTreeFile(treefileName) {
  const treestring = fs.readFileSync(treefileName, 'utf8');
  const stringArray = treestring.split(/\r?\n/);
  const tree = stringArray.map(line => [line.split(' ')[0], parseInt(line.split(' ')[1])]);
  // tree = array[[<categoryName>, <parentId>], ...]

  return tree;
}

function deleteOldCache(client, cacheSize) {
  var query = 'nodeType:' + cacheSize;
  client.deleteByQuery(query,function(err,obj){
     if(err){
     	console.log(err);
     }else{
     	console.log("cache " + cacheSize + " cleared");
     }
  });
}

function deleteCacheVideo(client, cacheSize, video) {
  var query = 'nodeType:' + cacheSize + ' AND video:' + video;
  client.deleteByQuery(query,function(err,obj){
     if(err){
     	console.log(err);
     }else{

      client.commit();
     	console.log("video " + video + ' of cache ' + cacheSize + " cleared");
      // writeLine(res, "video " + video + ' of cache ' + cacheSize + " cleared");
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

    var solrQuery = client.createQuery()
    				   .q(query)
               .sort(sort)
    				   .start(0)
    				   .rows(1);

    client.search(solrQuery, (err, obj) => {
      if(err) { reject(err) }
      else {
        resolve(obj.response.docs[0]);
      }
    });
  });
}

function getKeyframe(client, video, second) {
  return new Promise((resolve, reject) => {
    var query = client.createQuery()
    				   .q(util.format('nodeType:1 AND video:%i AND second:%i', video, second))
               .sort({'probability': 'desc'})
               .start(0)
    				   .rows(1);

    client.search(query,(err, obj) => {
      if(err) reject(err)
      else {
        let keyframe = obj.response.docs[0];

        if(typeof keyframe === 'undefined')
        {
          return resolve(null);
        }

        delete keyframe.id;
        delete keyframe._version_;

        resolve(keyframe);
      }
    });
  });

}

function getBestKeyframe(client, video, startSecond, endSecond, categoryId, cacheSize) {
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
        bestKeyframe.nodeType= cacheSize;
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
        data.push({ nodeType : 1, probability: (i%10)/10, startSecond: i, endSecond: i, video: v, second: i, net: 'cnn_googleyolo', count: 1, category: categories[category], categoryName: category });
      }
    }
  }
  client.add(data,function(err,obj){
     if(err){
        console.log(err);
     }else{
        client.commit();
        return res.json("done");
     }
  });
}

app.get('/update/:cache', async function cacheUpdateHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  let allowedCaches = [10, 30, 60, 180];

  if(!cacheUpdateSemaphore.available()) {
    // writeLine(res, 'another cache request is running.' );
    return res.end('another cache request is running.');
  }

  // uncomment if you want to delet all data and generate demo data
  // return generateDemoData(client, res);

  let cacheSize = parseInt(req.params.cache);
  if(!allowedCaches.includes(cacheSize)) {
    return res.end("cacheSize " + cacheSize + " not allowed.");
  }

  cacheUpdateSemaphore.take(async function() {
    // deleteOldCache(client, cacheSize);
     // highest video number in cache
    let cachedVideosResponse = (await getLimit(client, 'video', 'nodeType:' + cacheSize));

    let cachedVideos = 1;
    if(typeof cachedVideosResponse !== 'undefined' ) {
      // deleteCacheVideo(client, cacheSize, cachedVideosResponse.video); // remove last video
      // writeLine(res, "video " + cachedVideosResponse.video + ' of cache ' + cacheSize + " cleared");
      writeLine(res, "cached videos: " + cachedVideosResponse.video);
      cachedVideos = parseInt(cachedVideosResponse.video) + 1;
    }


    let videos = (await getLimit(client, 'video')).video; // highest video number
    let categories = (await getLimit(client, 'category')).category; // highest category number
    let seconds = (await getLimit(client, 'second')).second; // longest video
    let data = [];
    let datacounter = 0;
    let startTime = new Date();

    writeLine(res, "total videos: " + videos);

    for (let video = cachedVideos; video <= videos; video++) { // start with last cached video
      let promises = [];
      for (let category = 0; category <= categories; category++) {
        let bestKeyframe = await getBestKeyframe(client, video, 1, seconds, category, cacheSize);
        if(bestKeyframe)
        {
          // if this video has any entry in this category

          for (let second = 1; second <= keyCount[video.toString().padStart(5, '0')]; second += cacheSize) {
            // check every group of seconds from 1 to seconds

            let bestKeyframePromise = getBestKeyframe(client, video, second, second + cacheSize - 1, category, cacheSize);
            promises.push(bestKeyframePromise);
            // if(bestKeyframe) // update cache array
            //   data.push(bestKeyframe);
          }
        }
      }

      let values = await Promise.all(promises);
      values = values.filter(element => element !== null);
      // data = data.concat(values);

      client.add(values,function(err,obj){
        if(err){
         console.log(err);
        }else{
          // console.log("uploaded data")
          client.commit();
          // console.log("data commit")
        }

      });

      datacounter += values.length;

      const time = (new Date() - startTime) / 1000;

      console.log("video: " + video + " of " + videos);
      console.log("commited: " + values.length);
      console.log("total: " + datacounter + "\n");

      writeLine(res, "");
      writeLine(res, "video: " + video + " of " + videos + ' (' + Math.round(video/videos*10000)/100 + "%)");
      writeLine(res, "keyframes: " + keyCount[video.toString().padStart(5, '0')]);
      writeLine(res, "commited: " + values.length);
      writeLine(res, "total: " + datacounter);
      writeLine(res, "time taken: " + JSON.stringify(convertSeconds(time)));
      writeLine(res, "estimated time: " + JSON.stringify(convertSeconds(time / ((video - cachedVideos + 1)/(videos - cachedVideos + 1)))));

  // console.info('Execution time: %dms', end)

      data = [];
    }

    // res.json("done: " + data.length + " Objects cached.");
    cacheUpdateSemaphore.leave();
    return res.end("<br/> done..");
  });

});


app.get('/generate-docs', async function cacheUpdateHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');

  client.deleteByQuery("keyframe:*",function(err,obj){
     if(err){
     	console.log(err);
     }else{
     	console.log("old docs cleared");
     }
  });


    let videos = (await getLimit(client, 'video')).video; // highest video number
    let categories = (await getLimit(client, 'category')).category; // highest category number
    let seconds = (await getLimit(client, 'second')).second; // longest video
    let data = [];
    let datacounter = 0;
    let startTime = new Date();

    writeLine(res, "total videos: " + videos);

    for (let video = 1; video <= videos; video++) {
      data = [];
      for (let second = 1; second <= seconds; second += 1) {
          let keyframe = await getKeyframe(client, video, second);
          if(keyframe)
          {
            keyframe.keyframe = video + "_" + second;
            data.push(keyframe);
          }
      }

      client.add(data,function(err,obj){
        if(err){
         console.log(err);
        }else{
          client.commit();
        }
      });

      const time = (new Date() - startTime) / 1000;

      console.log("video: " + video + " of " + videos);

      writeLine(res, "");
      writeLine(res, "video: " + video + " of " + videos + ' (' + Math.round(video/videos*10000)/100 + "%)");
      writeLine(res, "time taken: " + JSON.stringify(convertSeconds(time)));
      writeLine(res, "estimated time: " + JSON.stringify(convertSeconds(time / (video/videos))));

    }

    return res.end("<br/> done..");

});

function writeLine(res, line) {
  res.write('<br/>' + line);
}


console.log(`Listening on ${port}`);
let server = app.listen(port);

server.timeout = 1000 * 1000;
