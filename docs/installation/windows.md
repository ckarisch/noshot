# Windows Installation

## Installing and configuring Solr

Get [Chocolatey](https://chocolatey.org/docs/installation#more-install-options), open command prompt with elevated priviledges and install solr via:

```
choco install solr
```

Start Server in unpriviledged command prompt (default `[install_dir]=C:\tools\solr-8.3.0\bin`):

```
[install_dir]\bin\solr.cmd start
```
Expected output:
```
Waiting up to 30 to see Solr running on port 8983
Started Solr server on port 8983. Happy searching!
```

Make sure `[install_dir]` is writable (i.e. right click folder and un-check `Read-only`, apply for all subfolders). Copy [core1](../../appdata/solr/core1) folder to `[install_dir]\server\solr`.

Open [http://localhost:8983/solr/](http://localhost:8983/solr/). Create a new core using `Core Admin` using following config:

```
name:        core1
instanceDir: core1
dataDir:     core1/data
config:      solrconfig.xml
schema:      schema.xml
```

Select `core1` via the dropdown menu and import YOLO9000 data (`export.json`) using the import [script](../../scripts/import_json_file_to_solr.sh) (Hint: this script requires curl, install via `choco install curl`):

```
import_json_file_to_solr.sh path/to/export.json
```

Importing may take some time. Test if everything worked using the `Query` Button and issuing a `*.*` querying, which should retrieve `7983689` results.

## Install Vue.js
Install [Node.js](https://nodejs.org/), open command prompt with elevated priviledges and install Vue.js CLI via:

```
npm install -g @vue/cli
npm install -g @vue/cli-service-global
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
Navigate to [src](../../noshot/src) and run `vue serve` or `npm run serve`.

## Errors

Fsevents:
```
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.9 (node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.9: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})
```
Run `npm i -f`.
