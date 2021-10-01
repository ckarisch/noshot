# NoShot setup

## Keyframes and Videos
Place keyframes in /keyframes folder served via http on localhost:80. \
structure:\
/keyframes/\<video\>/\<video\>_\<keyframe\>_key.jpeg \
/keyframes/00000/00000_0000000_key.jpeg \

Place video folder served via http on localhost:80. \




## install solr
Goto solr install dir \
Copy noshot/appdata/solr/noshot_solr_config to server/solr/configsets

```
bin/solr create -c noshot -d noshot_solr_config -n noshot_solr_config
```
OR:
```
sudo su - solr -c "/opt/solr-8.3.0/bin/solr create -c noshot -d noshot_solr_config -n noshot_solr_config"
```

OR create core manually in solr web dashboard (http://localhost:8983)



## import json into solr server:
```
curl -X POST -H 'Content-Type: application/json' 'http://localhost:8983/solr/noshot/update' --data-binary @data.json
```

## export solr data to json (only for distributing changes of the solr database):
```
curl "http://localhost:8983/solr/noshot/select?q=*%3A*&wt=json&indent=true&start=0&rows=2000000000&fl=nodeType,startSecond,endSecond,video,second,net,count,parentCategory,category,probability,boundingBox,categoryName" > solr-export.json
```

# Yolo9000
To use yolo9000, download the weights first:
```
cd scripts/cfg
wget https://github.com/philipperemy/yolo-9000/raw/master/yolo9000-weights/xaa
wget https://github.com/philipperemy/yolo-9000/raw/master/yolo9000-weights/xab
cat x* > yolo9000.weights
rm xaa
rm xab
```
