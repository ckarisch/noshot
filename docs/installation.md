# Installation Instructions

## Install and configure Solr

### Windows

Get [Chocolatey](https://chocolatey.org/docs/installation#more-install-options), open command prompt with elevated priviledges and install solr via:

```
choco install solr
```

Start Server in unprivileged command prompt (default `[install_dir]=C:\tools\solr-8.3.0\bin`):

```
[install_dir]\bin\solr.cmd start
```
Expected output:
```
Waiting up to 30 to see Solr running on port 8983
Started Solr server on port 8983. Happy searching!
```

### Linux

1. Install Java
```
sudo apt install openjdk-11-jdk
```
2. Install Apache Solr
```
cd /opt
wget https://archive.apache.org/dist/lucene/solr/8.3.1/solr-8.3.1.tgz
tar xzf solr-8.3.1.tgz solr-8.3.1/bin/install_solr_service.sh --strip-components=2
sudo bash ./install_solr_service.sh solr-8.3.1.tgz
```
3. Start/Stop Solr Service
```
sudo service solr stop
sudo service solr start
sudo service solr status
```

### Post Solr installtion

1. Make sure `[install_dir]` is writable by user `solr` (i.e. right click folder and un-check `Read-only`, apply for all subfolders). E.g. (Linux):
```
sudo chown -R user:solr /var/solr
sudo chmod -R 775 /var/solr
```

2. copy `noshot/appdata/solr/noshot_solr_config` to `[install_dir]/server/solr/configsets`

3. Create a new `noshot` core.
#### Linux (bash)
```
sudo su - solr -c "/opt/solr-8.3.0/bin/solr create -c noshot -d noshot_solr_config -n noshot_solr_config"
```
#### Windows (cmd)
```
C:\tools\solr-8.3.0\bin\solr create -c noshot -d noshot_solr_config -n noshot_solr_config -p 8983
```
Trobleshooting:
  * Error: `The system cannot find the batch label specified - parse_create_args`,
    Solution: `unix2dos C:\tools\solr-8.3.0\bin\solr.cmd`

4. Import YOLO9000 JSON (`data.json`) - Replace `'` with `"` in Windows:
```
curl -X POST -H 'Content-Type: application/json' 'http://localhost:8983/solr/noshot/update' --data-binary @data.json
```
or without loading the whole file into memory
```
curl -X POST -H 'Content-Type: application/json' 'http://localhost:8983/solr/noshot/update' -T data.json
```
Importing may take some time. Test if everything worked by opening [http://localhost:8983/solr/](http://localhost:8983/solr/), using the `Query` Button and issuing a `*.*` querying, which should retrieve `7983689` results.

## Install Vue.js
Install [Node.js](https://nodejs.org/), open command prompt with elevated priviledges and install Vue.js CLI via:

```
npm install -g @vue/cli @vue/cli-service-global
```

## Serving Keyframes

Keyframes are hosted via a local Apache2 server. Either extract the keyframes directly into the server's `htdocs` folder or create a symlink to the extracted keyframes the name `keyframes` to this location in your Apache htdocs folder, i.e.:

```
mklink /D path/to/apache2/htdocs/keyframes path/to/extracted/keyframes
```

Make sure [http://localhost/keyframes](http://localhost/keyframes) is accessible by Apache2.

## Setup Project

Navigate to [server](../../server/) folder, run `npm install` and `npm start`.
Navigate to [noshot](../../noshot) folder, run `npm install`.
Navigate to [src](../../noshot) and run `npm start` or `npm run serve` (DONT use `vue serve`, since it hides public folder with config files).

## Errors

Fsevents:
```
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.9 (node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.9: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})
```
Run `npm i -f`.
