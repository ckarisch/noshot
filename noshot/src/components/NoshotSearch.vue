<template>
  <div class="searchContent">
    <div class="menuLeft">
      <span>{{search.images.length}}</span>
    </div>
    <div class="searchNavigation">
        <input placeholder="Suchbegriff" v-model="search.title" @keyup="fetchSolrSearch(search)" />
        <div class="slidecontainer">
          cache ({{ search.selectedCache }})
          <input type="range" min="1" max="180" value="1" class="slider" v-model="search.cacheRange" @change="updateCacheRange(search)">
        </div>
        <div class="slidecontainer">
          range ({{ search.videoRange }})
          <input type="range" min="0" max="5" value="1" class="slider" v-model="search.videoRange" @change="fetchSolrSearch(search)">
        </div>
    </div>
    <div :class="{ showFrames: search.frames, resultContainer: true }">
        <div>
            <div v-for="img in search.images" :key="search.id + '_' + img.video + '_' + img.second" :data="search.id + '_' + img.video + '_' + img.second" :probability="img.probability">
                <NoshotImage :search="search" :img="img"/>
                <span class="imageDescription"><strong>{{img.categoryName}}</strong> <br/>Parent: <strong>{{img.parentName}}</strong> <br/>Confidence: <strong>{{Math.round(img.probability * 100) / 100}}</strong></span>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import NoshotImage from './NoshotImage.vue'

export default {
    name: 'NoshotSearch',
    components: {
      NoshotImage
    },
    created() {
      this.notifyParents(this, 'fetch-solr-search', this.search);  
    },
    props: {
      search: Object
    },
    data: () => {
        return {
            selectedNetwork: 'cnn_yolo',
            nets: ['cnn_yolo'],
            caches: [1, 10, 30, 60, 180],
            cacheRange: 1
        };
    },

    methods: {

        fetchSolrSearch: function(search) {
          this.notifyParents(this, 'fetch-solr-search', search);
        },
        logCategories: function(docs) {
            if (docs.length > 0) {
                let categories = {};
                for (let doc of docs) {
                    categories[doc.categoryName] = null;
                }
            }
        },

        updateCacheRange: function(search) {
          const temp = search.selectedCache;
          search.selectedCache = this.getClosest(search.cacheRange, this.caches);
          if(temp != search.selectedCache)
            this.fetchSolrSearch(search);
        },

        getClosest: function(goal, allowed) {
          return allowed.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
          });
        }
    },

}

</script>
