<template>
  <div class="searchContent">
    <div class="menuTop">
        <div class="menuLeft">
          <span v-if="search.images">{{search.images.length}}</span>
        </div>
        <paginate v-if="search.pages"
          :page-count="search.pages"
          :click-handler="changePage"
          :prev-text="'Prev'"
          :next-text="'Next'"
          :container-class="'pagination'"
          ref="paginate">
        </paginate>
    </div>
    <div class="searchNavigation">
        <vue-suggestion :items="items"
                  v-model="searchText"
                  :setLabel="setLabel"
                  :itemTemplate="itemTemplate"
                  @keyup="keyup"
                  @changed="inputChange"
                  @selected="itemSelected">
        </vue-suggestion>
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
                <NoshotImage :search="search" :searchToolSettings="searchToolSettings" :img="img"/>
                <span class="imageDescription"><strong>{{img.categoryName}}</strong> <br/>Parent: <strong>{{img.parentName}}</strong> <br/>Confidence: <strong>{{Math.round(img.probability * 100) / 100}}</strong> <br/>image: {{img.video + '_' + img.second}}</span>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import NoshotImage from './NoshotImage.vue'
import itemTemplate from './NoshotSuggestion.vue';

export default {
    name: 'NoshotSearch',
    components: {
      NoshotImage
    },
    created() {
      // Andi: disabled due to double multi-dispatch of searches
      // this.notifyParents(this, 'fetch-solr-search', this.search);
      this.searchText.id = this.search.title;
    },
    props: {
      search: Object,
      searchToolSettings: Object,
      pages: Number
    },
    data: () => {
        return {
            selectedNetwork: 'cnn_yolo',
            nets: ['cnn_yolo'],
            caches: [1, 10, 30, 60, 180],
            cacheRange: 1,
            categories: window.appCfg.categoryNames,
            searchText: {},
            item: null,
            items: [],
            itemTemplate
        };
    },

    watch: {
        pages: function() {
            this.$refs.paginate.selected = this.search.page;
            console.log("pages changed");
        }
    },
    methods: {
        changePage: function(pageNum) {
          this.search.page = pageNum;
          this.fetchSolrSearch(this.search);
        },

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
        },

        itemSelected (item) {
          console.log("selected")
          this.item = item.id;
          this.search.title = item.id;
          // Andi: enabled, this only dispatches single search on selecting item
          if(this.search.title)
            this.fetchSolrSearch(this.search);
        },
        setLabel (item) {
          this.search.title = item.id;
          this.searchText = item;
          // Andi: disabled due to double multi-dispatch of searches
          // if(this.search.title)
          //   this.updateFilter(this.search.title);
          return this.searchText.id;
        },
        inputChange (text) {
          console.log("change")
          this.updateFilter(text);
        },
        updateFilter(text) {

          const filtered = this.categories.filter(item => item.includes(text));
          const found = filtered.includes(text);
          const msg = found ? "" : " (not found)";

          this.items = filtered.slice(0,20);
          this.items = this.items.map(item => {return { id: item, name: item}});

          this.items.unshift({id: text, name: text + msg });
          this.items.push({id: filtered[0], name: "showing " + Math.min(20, filtered.length) + " of " + filtered.length });

          if(found) {
            this.search.title = text;
            this.fetchSolrSearch(this.search);
          }
        },
        keyup () {
          console.log("keyup");
        }
    },

}

</script>
