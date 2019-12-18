<template>
      <section class="main" v-show="searches.length" v-cloak>

          <input class="new-search" autofocus autocomplete="off" placeholder="enter new search" v-model="newSearch" @keyup.enter="addSearch">

          <ul class="dive-layout searches minimized">
              <li v-for="search in filteredSearchesMinimized" class="search searchContainer" :key="search.id" :class="{ marked: search.marked, editing: search == editedSearch, minimized: search.minimized, maximized: search.maximized }">
                  <div class="view">
                      <div class="menu">
                          <button class="minimize" @click="minimizeSearch(search)"></button>
                          <button class="destroy" @click="removeSearch(search)"></button>
                      </div>
                      <div class="searchNavigation">
                          <input placeholder="Suchbegriff" v-model="search.title" />
                      </div>
                  </div>
              </li>
          </ul>
          <ul class="dive-layout searches">
              <li v-for="search in filteredSearches" :key="search.id" :class="{ search: true, searchContainer: true, minimized: search.minimized, maximized: search.maximized }">
                  <div class="view">
                      <div class="menuLeft">

                        <span>{{search.images.length}}</span>
                      </div>
                      <div class="menu">
                          <button class="minimize" @click="minimizeSearch(search)"></button>
                          <button class="maximize" @click="maximizeSearch(search)"></button>
                          <button class="destroy" @click="removeSearch(search)"></button>
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
                </li>
          </ul>


          <div class="footer" v-show="searches.length" v-cloak>
              <span class="search-count">
                  Searches: <strong>{{ all }}</strong>
              </span>
          </div>
      </section>
</template>

<script>
import NoshotImage from './NoshotImage.vue'

// localStorage persistence
var STORAGE_KEY = 'DIVE-layout'
var searchStorage = {
    fetchSearches: function() {
        var searches = JSON.parse(localStorage.getItem(STORAGE_KEY + "_searches") || '[]')
        searches.forEach(function(search, index) {
            search.id = index
        })
        searchStorage.uid = searches.length
        return searches
    },
    save: function(searches) {
        localStorage.setItem(STORAGE_KEY + "_searches", JSON.stringify(searches))
    }
}

export default {
    name: 'SearchTool',
    components: {
      NoshotImage
    },
    created() {
    },
    props: {
      activeWorkspace: Object
    },
    data: () => {
        return {
            searches: searchStorage.fetchSearches(),
            newSearch: '',
            editedSearch: null,
            selectedNetwork: 'cnn_googleyolo',
            nets: ['cnn_yolo'],
            caches: [1, 10, 30, 60, 180],
            loading: false,
            post: null,
            error: null,
            cacheRange: 1
        };
    },

    // watch searches change for localStorage persistence
    watch: {
        searches: {
            handler: function(searches) {
                searchStorage.save(searches)
            },
            deep: true
        }
    },

    computed: {
        filteredSearches: function() {
            let app = this;
            return this.searches.filter(function(search) {
                var workspaceVisible = search.workspace == app.visibility || search.workspace == 0 || search.workspace === undefined;
                return workspaceVisible && search.minimized == false;
            })
        },
        filteredSearchesMinimized: function() {
            let app = this;
            // console.log(app.visibility)
            return this.searches.filter(function(search) {
                var workspaceVisible = search.workspace == app.visibility || search.workspace == 0 || search.workspace === undefined;
                return workspaceVisible && search.minimized == true;
            })
        },

        all: function() {
            return this.searches.length
        }
    },

    methods: {
        addSearch: function() {
            var value = this.newSearch && this.newSearch.trim()
            if (!value) {
                return
            }
            var s = {
                id: searchStorage.uid++,
                title: value,
                frames: true,
                workspace: this.visibility,
                minimized: false,
                maximized: false,
                selectedCache: 1,
                images: [],
                selectedNetwork: this.nets[0],
                videoRange: 0
            }
            this.searches.push(s);

            if (!this.activeWorkspace.searches)
                this.activeWorkspace.searches = [];
            this.activeWorkspace.searches.push(s);
            this.newSearch = '';

            this.fetchSolrSearch(s);

        },

        removeSearch: function(search) {
            this.searches.splice(this.searches.indexOf(search), 1)
        },

        minimizeSearch: function(search) {
            search.minimized = !search.minimized;
        },

        maximizeSearch: function(search) {
            search.maximized = !search.maximized;
        },

        fetchSolrSearch: function(search) {
            this.error = this.post = null
            this.loading = true
            let net = search.selectedNetwork;
            let cache = search.selectedCache;

            getFromSolr(net, search.title, cache, (err, docs) => {
                this.loading = false
                if (err) {
                    this.error = err.toString()
                    // console.log(this.error)
                } else {
                    search.images = docs;
                    this.logCategories(docs);
                }
            })
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

    // a custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    // http://vuejs.org/guide/custom-directive.html
    directives: {
        'search-focus': function (el, binding) {
            if (binding.value) {
                el.focus()
            }
        }
    }
}

function getFromSolr(net, category, cache, callback) {
    const Http = new XMLHttpRequest();
    const url = 'http://' + location.hostname + ':3001/search/' + net + '/' + category + '/' + cache;

    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange = (e) => {
        if (e.currentTarget.readyState == 4 && e.currentTarget.status == 200) {
            callback(null, JSON.parse(Http.responseText));
        }
    }
}

</script>
