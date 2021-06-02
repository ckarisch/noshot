const http = require('http');
var express = require('express');
var app = express();
var util = require('util');
var querystring = require('querystring');
var fs = require('fs');
var Jimp = require('jimp');
const url = require('url');
const cacheUpdateSemaphore = require('semaphore')(1)
var convertSeconds = require('convert-seconds');
// bodyparser for sending different http request bodies
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));     // support encoded bodies
app.use(bodyParser.json());                             // support json encoded bodies
var rimraf = require("rimraf");         // folder manipulation
var path = require('path');             // path handling
var recursive = require("recursive-readdir");
const directoryExists = require('directory-exists');
var mkdirp = require('mkdirp');         // create multiple dirs
let cors = require('cors');             // cross origin requests (localhost -> localhost:3001)
app.use(cors());                        // allow all origins -> Access-Control-Allow-Origin: *

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
const logDir = 'logs';

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

app.get(['/search/:net/:category/:cache/:page/:selectedBrightnessFilter/:excludeVideos', '/search/:net/:category/:cache/:page/:selectedBrightnessFilter/'], function searchHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  const rows = 200;
  let net = req.params.net;
  let category = req.params.category;
  let cache = req.params.cache;
  let page = req.params.page;
  let excludeVideos = req.params.excludeVideos
  let selectedBrightnessFilter = req.params.selectedBrightnessFilter;

  if(excludeVideos !== undefined)
  {
      excludeVideos = excludeVideos.split(',');
  }
  else { excludeVideos = [] }

  if(category !== undefined)
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

    // add searched category
    children.push(categoryId[0]);
    const solrGetUrl = new url.URL('http://' + hostname + ':8983/solr/noshot/select');

    let categoryString = '';
    for (let c of children) {
      if (categoryString != '')
        categoryString += ' OR ';
      categoryString += c;
    }

    let excludeVideosString = '';
    if(excludeVideos !== undefined)
    for (let c of excludeVideos) {
      if (excludeVideosString != '')
        excludeVideosString += ' OR ';
      excludeVideosString += c;
    }

    //const queryItems = [['categoryName', category], ['net', net], ['nodeType', cache]];
    const queryItems = [
        ['category', '(' + categoryString + ')'],
        ['net', net],
        ['nodeType', cache]
    ];

    // select A >= B
    const gteQueryItems = [];

    if (excludeVideosString !== '')
    {
        queryItems.push(['!video', '(' + excludeVideosString + ')']);
    }

    if (selectedBrightnessFilter !== '-1'){
      for(let i = 1; i <= 6; i++) {
        if(i != selectedBrightnessFilter)
          gteQueryItems.push(['b' + selectedBrightnessFilter, 'b'+i]);
      }
    }
    //{!frange l=0 incl=false}sub(b2,b1)
    let q = '';
    for (let e of queryItems) {
        if (q != '')
            q += ' AND ';
        q += e[0] + ':' + e[1];
    }
    q = q.replaceArray([' ', ':'], ['+', '%3A']);

    let fq = '';
    for (let e of gteQueryItems) {
        fq += '&fq={!frange l=0 incl=false}sub(' + e[0] + ',' + e[1] + ')';
    }
    fq = fq.replaceArray([' ', ':'], ['+', '%3A'], ['{', '%7B'], ['}', '%7D'], [',', '%2C']);

    // const params = util.format('&rows=%i&sort=probability%20desc&group=true&group.field=video&group.main=true', 1000);
    const params = util.format('&sort=probability%20desc&rows=%i&start=%i', rows, rows * (page - 1));

    console.log('/solr/noshot/select?q=' + q + fq + params);

    http.get({
        hostname: 'localhost',
        port: 8983,
        path: '/solr/noshot/select?q=' + q + fq + params,
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
            {
                jdata.response.docs = filterSolrResponse(jdata.response.docs);
                res.json(jdata.response);
            }
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

function getKeyframe(client, video, second, includeID = false) {
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

        if(!includeID)
          delete keyframe.id;

        delete keyframe._version_;

        resolve(keyframe);
      }
    });
  });
}

function getKeyframes(client, video, second) {
  return new Promise((resolve, reject) => {
    var query = client.createQuery()
    				   .q(util.format('video:%i AND second:%i', video, second))
               .sort({'probability': 'desc'})
               .start(0)
    				   .rows(100);

    client.search(query,(err, obj) => {
      if(err) reject(err)
      else {
        let keyframes = obj.response.docs;

        if(typeof keyframes === 'undefined')
        {
          resolve(null);
        }
        else {
          resolve(keyframes);
        }
      }
    });
  });
}

function removeKeyframe(id) {
  return new Promise((resolve, reject) => {
    client.delete('id', id, function(err,obj){
      if(err){
        console.log('remove error:')
        console.log(err);
        reject(err);
      }else{
        resolve(true);
      }
   });
  });
}

function removeKeyframeByQuery(video) {
  return new Promise((resolve, reject) => {
    client.deleteByQuery(util.format('video:%i', video), function(err,obj){
      if(err){
        console.log('remove error:')
        console.log(err);
        reject(err);
      }else{
        resolve(true);
      }
   });
  });
}

function addKeyframe(keyframe) {
  return new Promise((resolve, reject) => {
    client.add(keyframe,function(err,obj){
      if(err){
        console.log('add keyframe err:');
        console.log(err);
        reject(err);
      }else{
        resolve(true);
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

function getFoundObjectsForCategory(client, categoryId) {
  return new Promise((resolve, reject) => {
    var query = client.createQuery()
    				   .q(util.format('nodeType:1 AND category:%i', categoryId))
               .start(0)
    				   .rows(0);

    client.search(query,(err, obj) => {
      if(err) reject(err)
      else {
        let numFound = obj.response.numFound;

        if(typeof numFound === 'undefined')
        {
          return resolve(null);
        }

        resolve([categoryId, numFound]);
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


app.get('/generate-stats', async function cacheUpdateHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');

    let data = [];
    let promises = [];
    let startTime = new Date();

    let categories = (await getLimit(client, 'category')).category; // highest category number
    writeLine(res, "total categories: " + categories);
    res.write("<style type=\"text/css\" scoped>td { min-width: 180px; padding: 0 5px; } </style>");
    res.write("<table>");
    res.write("<tbody>");
    res.write("<th>row</th><th>category</th><th>numFound</th>");

    for (let category = 0; category <= categories; category++) {
          let numFoundPromise = getFoundObjectsForCategory(client, category);
          promises.push(numFoundPromise);
    }

    data = await Promise.all(promises);
    data = data.filter(e => e !== null);
    data.sort((a, b) => { return a[1] < b[1] ? 1 : -1});

    let sum = 0;
    for (let d = 0; d < data.length; d++)
    {
      res.write("<tr><td>" + data[d][1] + "</td></tr>");
      sum += data[d][1];
    }

    res.write("</tbody>");
    res.write("</table>");

    res.write("sum: " + sum);

    const time = (new Date() - startTime) / 1000;
    // writeLine(res, "");

    //console.info('Execution time: %dms', end)

    data = [];

    return res.end("<br/> done..");
});

const luminance = (pixelColor) => {
  const rgb = Jimp.intToRGBA(pixelColor);
  return (0.2126*rgb.r + 0.7152*rgb.g + 0.0722*rgb.b);
}

const averageLuminance = (image, x, y, w, h) => {
  const pixels = new Array(w * h).fill(0);
  const luminances = pixels.map((pixel, i) => {return luminance(image.getPixelColor(i % w + x, parseInt(Math.floor(i / w) + y)))});
  const sum = luminances.reduce((sum, lum) => { return sum + lum; }, 0);
  return sum / pixels.length;
}

const writeAndLog = (res, s) => {
  console.log(s);
  writeLine(res, s);
}

var brightnessFilterWidth = 3;
var brightnessFilterHeight = 2;
// get luminance of all sections defined by brightnessFilterWidth and brightnessFilterHeight
const luminanceArray = (image) => {
  const sectionWidth = (image.bitmap.width / brightnessFilterWidth);
  const sectionHeight = (image.bitmap.height / brightnessFilterHeight);
  const sections = new Array(parseInt(brightnessFilterWidth * brightnessFilterHeight)).fill(0);
  const sectionsLuminance = sections.map((s, i) => {
    return Math.round(averageLuminance(image, (i % brightnessFilterWidth) * sectionWidth, Math.floor(i / brightnessFilterWidth) * sectionHeight, sectionWidth, sectionHeight));
  })
  return sectionsLuminance;
}

app.get('/update-brightness-cache/:start/:end', async function cacheUpdateHandler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');

  let start = parseInt(req.params.start);
  let end = parseInt(req.params.end);
  if(!cacheUpdateSemaphore.available()) {
    return res.end('another cache request is running.');
  }

  cacheUpdateSemaphore.take(async function() {

    let startTime = new Date();
    writeAndLog(res, 'start generating brightness cache');

    let videos = (await getLimit(client, 'video')).video; // highest video number
    videos = Math.min(videos, end);
    writeAndLog(res, "total videos: " + (videos - start));
    writeAndLog(res, '');

    for (let video = start; video <= videos; video++) { // start with last cached video
      if(video >= end) {
        cacheUpdateSemaphore.leave();
        writeAndLog(res, 'done (100%)');
        return res.end('<br/>ended on video ' + video + ' (video ' + video + ' is not updated)');
      }
      let seconds = keyCount[video.toString().padStart(5, '0')];

      writeAndLog(res, "start video: " + video + " of " + videos + ' (' + Math.round((video-start)/(end-start)*10000)/100 + "%)");
      writeAndLog(res, 'analyze brightness');

      let allVideoKeyframes = [];
      for (let second = 0; second <= seconds; second += 1) {
        let keyframes = await getKeyframes(client, video, second);
        if(!keyframes) {
          writeAndLog(res, "error at video " + video + " of " + videos + ', second ' + second + ' of ' + keyCount[video.toString().padStart(5, '0')]);
          continue;
        }
        if(!keyframes.length) {
          continue;
        }

        // every entry has the same image
        const videoStr = keyframes[0].video.toString().padStart(5, '0');
        let image = await Jimp.read('C:/xampp/htdocs/keyframes/' + videoStr + '/' + videoStr + '_' + keyframes[0].second + '_key.jpg')
        const lArray = luminanceArray(image);


        for (let keyframe of keyframes) {
          keyframe.b1 = lArray[0];
          keyframe.b2 = lArray[1];
          keyframe.b3 = lArray[2];
          keyframe.b4 = lArray[3];
          keyframe.b5 = lArray[4];
          keyframe.b6 = lArray[5];
          delete keyframe.id; // remove solr doc id
          delete keyframe._version_; // remove solr doc version
          allVideoKeyframes.push(keyframe);
        }
      }

      writeAndLog(res, 'write changes to solr');
      await removeKeyframeByQuery(video);
      await addKeyframe(allVideoKeyframes);
      client.commit();

      const time = (new Date() - startTime) / 1000;

      writeAndLog(res, "time elapsed: " + JSON.stringify(convertSeconds(time)));
      writeAndLog(res, "estimated time: " + JSON.stringify(convertSeconds(time / (video-start + 1) * (end-start))));
      writeAndLog(res, "");
    }

    cacheUpdateSemaphore.leave();
    return res.end("<br/>done (100%)");
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

/* LOGGING */

// write log file (make sure 'logs' folder is writable!)
app.put('/log', createLogDir, (req, res) => {
  let savePath = logDir + '/' + req.body.file;
  let data = req.body.json;
  fs.writeFile(savePath, data, (err) => {
    if (err) {
      res.status(500).end();
      // throw err;
      return;
    }
    // success case, the file was saved
    console.log('Log saved: ' + savePath);
    res.sendStatus(200);
  });
});

app.get('/log', createLogDir, (req, res) => {
  recursive(logDir, function (err, files) {
    //handling error
    if (err) {
        console.log('Unable to scan directory: ' + err);
        res.status(500).end();
        // throw err;
        return;
    }
    res.status(200).send({files: files});
  });
});

app.delete('/log', (req, res) => {
  rimraf(logDir, (err) => {
    if (err) {
      res.status(500).end();
      // throw err;
      return;
    }
    // success: the dir was deleted
    console.log("Cleared log!");
    res.sendStatus(200);
  });
});

// create log middleware route
function createLogDir(req, res, next) {
  dirPath = logDir;
  if (req.body.file !== undefined) dirPath = logDir + "/" + path.dirname(req.body.file);
  directoryExists(dirPath, (error, exists) => {
    if (exists) {
      // folder exists, continue route
      next();
      return;
    }
    createFolder(dirPath,
      (err) => {
        if (err) {
          console.log("Could not create logs folder - make sure server folder is writable.");
          res.status(500).end();
          return;
        }
        // dir created/exists, call next route
        next();
      }
    );
  });
}

// folder creation helper
function createFolder(dirPath, cb) {
    mask = 0775;
    mkdirp(dirPath, {"mode": mask}, function(err) {
        if (err) {
          return cb(err);  // something went wrong
        } else {
          // successfully created folder
          console.log("Created folder: " + dirPath);
          cb(null);
        }
    });
}

console.log(`Listening on ${port}`);
let server = app.listen(port);

server.timeout = 1000 * 1000;
