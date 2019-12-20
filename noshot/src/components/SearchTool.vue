<template>
      <section class="main" v-cloak>

          <input class="new-search" autofocus autocomplete="off" placeholder="enter new search" v-model="newSearch" @keyup.enter="addSearch(createSearchForType(solr_search_type))">

          <ul class="dive-layout searches minimized">
              <li v-for="search in filteredSearchesMinimized" class="search searchContainer" :key="search.id" :class="{ marked: search.marked, editing: search == editedSearch, minimized: search.minimized, maximized: search.maximized }">
                  <div class="view">
                      <div class="menu">
                          <button class="minimize" @click="minimizeWindow(search)"></button>
                          <button class="destroy" @click="removeWindow(search)"></button>
                      </div>
                      <div class="searchNavigation">
                          <input placeholder="Suchbegriff" v-model="search.title" />
                      </div>
                  </div>
              </li>
          </ul>
          <ul class="dive-layout searches">
              <NoshotWindow v-for="search in filteredSearches" :search="search" :key="search.id" :class="{search: true, searchContainer: true, minimized: search.minimized, maximized: search.maximized }"/>
          </ul>

          <div class="footer" v-show="searches.length" v-cloak>
              <span class="search-count">
                  Searches: <strong>{{ all }}</strong>
              </span>
          </div>
      </section>
</template>

<script>
import NoshotWindow from './NoshotWindow.vue'

export default {
    name: 'SearchTool',
    components: {
      NoshotWindow
    },
    created() {
      // listeners
      this.$on('fetch-solr-search', (search) => {
        this.fetchSolrSearch(search);
      });
      this.$on('open-video-summary', (video) => {
        this.addSearch(this.createSearchForType(window.searchStorage.type.VIDEO_SUMMARY, video));
      });
      this.$on('minimize-window', (search) => {
        this.minimizeWindow(search);
      });
      this.$on('maximize-window', (search) => {
        this.maximizeWindow(search);
      });
      this.$on('remove-window', (search) => {
        this.removeWindow(search);
      });
    },
    props: {
      activeWorkspace: Object
    },
    data: () => {
        return {
            searches: window.searchStorage.fetchSearches(),
            newSearch: '',
            solr_search_type: window.searchStorage.type.SOLR_SEARCH,
            editedSearch: null,
            selectedNetwork: 'cnn_yolo',
            nets: ['cnn_yolo'],
            caches: [1, 10, 30, 60, 180],
            loading: false,
            post: null,
            error: null
        };
    },

    // watch searches change for localStorage persistence
    watch: {
        searches: {
            handler: function(searches) {
                window.searchStorage.save(searches)
            },
            deep: true
        }
    },

    computed: {
        filteredSearches: function() {
            let app = this;
            return this.searches.filter(function(search) {
                var workspaceVisible = search.workspace == app.activeWorkspace.id || search.workspace === undefined;
                return workspaceVisible && search.minimized == false;
            })
        },
        filteredSearchesMinimized: function() {
            let app = this;
            // console.log(app.visibility)
            return this.searches.filter(function(search) {
                var workspaceVisible = search.workspace == app.activeWorkspace.id || search.workspace === undefined;
                return workspaceVisible && search.minimized == true;
            })
        },

        all: function() {
            return this.searches.length
        }
    },

    methods: {
        addSearch: function(s) {
            if (!s) return;
            this.searches.push(s);

            if (!this.activeWorkspace.searches)
                this.activeWorkspace.searches = [];
            this.activeWorkspace.searches.push(s);
            this.newSearch = '';

            if (s.type === window.searchStorage.type.SOLR_SEARCH) this.fetchSolrSearch(s);

        },

        removeWindow: function(search) {
            this.searches.splice(this.searches.indexOf(search), 1)
        },

        minimizeWindow: function(search) {
            search.minimized = !search.minimized;
            search.maximized = false;
        },

        maximizeWindow: function(search) {
            search.maximized = !search.maximized;
            search.minimized = false;
        },

        fetchSolrSearch: function(search) {
            this.error = this.post = null
            this.loading = true
            let net = search.selectedNetwork;
            let cache = search.selectedCache;

            getFromSolr(net, search.title, cache, (err, docs) => {
                this.loading = false
                if (err) {
                    this.error = err.toString();
                } else {
                    search.images = docs;
                    this.logCategories(docs);
                }
            });
        },
        logCategories: function(docs) {
            if (docs.length > 0) {
                let categories = {};
                for (let doc of docs) {
                    categories[doc.categoryName] = null;
                }
            }
        },
        createSearchForType: function(type = window.searchStorage.type.NONE, payload = null) {
          let sObject = {
              id: window.searchStorage.uid++,
              type: type,
              workspace: this.activeWorkspace.id,
              minimized: false,
              maximized: false,
              images: []
          };

          switch(type) {
            case window.searchStorage.type.SOLR_SEARCH:
              var value = this.newSearch && this.newSearch.trim();
              if (!value) return null;
              sObject.title = value;
              sObject.frames = true;
              sObject.selectedCache = 1;
              sObject.selectedNetwork = this.nets[0];
              sObject.videoRange = 0;
              break;
            case window.searchStorage.type.VIDEO_SUMMARY:
              sObject.title = payload.id;
              sObject.video = payload;
              sObject.selectedCache = 1;
              sObject.images = this.getVideoSummaryImages(payload);
              break;
            case window.searchStorage.type.NONE:
            default:
              return null;
        }
        return sObject;
      },
      getVideoSummaryImages: function(video) {
        let keyframeBase = this.appCfg.dataServer.url + ':' + this.appCfg.dataServer.port + '/' + this.appCfg.dataServer.keyframesLocation + '/';
        // let testimg = document.querySelector('.testimg');
        let totalKeyFrames = parseInt(this.appCfg.keyCount[video.id]);
        let s = [];
        for (let i = 0; i < totalKeyFrames; i++) {
          let src = `${keyframeBase}${video.id}/${video.id}_${i}_key.jpg`;
          let v = this.utils.videoFromThumbUrl(src);
          v.second = i;
          let fakeDBResult = this.utils.videoToDBResult(v);
          s.push(fakeDBResult);
        }
        return s;
        // if (s.length > 0) this.search.images = s;
        // console.log(this.search.images);
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
