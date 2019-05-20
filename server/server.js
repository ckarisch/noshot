const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  let category = 430;

  http.get({
    hostname: 'localhost',
    port: 8983,
    path: '/solr/core1/select?q=category%3A' + category + '&rows=100',
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

      //console.log(data);
      res.end("Data:" + JSON.stringify(docs));
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
    res.end("Error: " + err.message);
  });

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
