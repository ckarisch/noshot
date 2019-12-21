place keyframes in /keyframes folder
structure:
/keyframes/<video>/<video>_<keyframe>_key.jpeg
/keyframes/00000/00000_0000000_key.jpeg




to use yolo9000, download the weights first:
cd scripts/cfg
wget https://github.com/philipperemy/yolo-9000/raw/master/yolo9000-weights/xaa
wget https://github.com/philipperemy/yolo-9000/raw/master/yolo9000-weights/xab
cat x* > yolo9000.weights
rm xaa
rm xab



install solr
goto solr install dir
copy noshot/appdata/solr/noshot_solr_config to server/solr/configsets

bin/solr create -c noshot -d noshot_solr_config -n noshot_solr_config
# OR better:
sudo su - solr -c "/opt/solr-8.3.0/bin/solr create -c noshot -d noshot_solr_config -n noshot_solr_config"

import json:
curl -X POST -H 'Content-Type: application/json' 'http://localhost:8983/solr/noshot/update' --data-binary @data.json


export:
curl "http://localhost:8983/solr/noshot/select?q=*%3A*&wt=json&indent=true&start=0&rows=2000000000&fl=nodeType,startSecond,endSecond,video,second,net,count,parentCategory,category,probability,boundingBox,categoryName" > solr-export.json
