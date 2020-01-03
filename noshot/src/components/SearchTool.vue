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
              <NoshotWindow :searchToolSettings="searchToolSettings" v-for="search in filteredSearches" :search="search" :key="search.id" :class="{search: true, searchContainer: true, minimized: search.minimized, maximized: search.maximized }"/>
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
      activeWorkspace: Object,
      searchToolSettings: Object
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
            this.logInteractLayout("addSearch", s);
            if (s.type === window.searchStorage.type.SOLR_SEARCH) this.fetchSolrSearch(s);

        },

        removeWindow: function(search) {
            this.searches.splice(this.searches.indexOf(search), 1);
            this.logInteractLayout("removeWindow", search);
        },

        minimizeWindow: function(search) {
            search.minimized = !search.minimized;
            search.maximized = false;
            this.logInteractLayout("minimizeWindow", search);
        },

        maximizeWindow: function(search) {
            search.maximized = !search.maximized;
            search.minimized = false;
            this.logInteractLayout("maximizeWindow", search);
        },

        logInteractLayout: function(method, search) {
          let cat = window.logging.logTypes.category.BROWSE;
          let data  = {
             category: cat.key,
             type: cat.types.TOOL_LAYOUT,
             value: {
               method: method,
               id: search.id,
               workspace: search.workspace,
               title: search.title,
               type: search.type
             }
          }
          this.notifyParents(this, 'log-event', data);
        },

        logResult(search) {
          let catText = window.logging.logTypes.category.TEXT;
          let catBrowse = window.logging.logTypes.category.BROWSE;
          let data = {};
          data.info =  {
            usedCategories: [catText.key, catBrowse.key],
            usedTypes: [catText.types.CONCEPT, catBrowse.types.RANKED_LIST],
            sortType:  [catBrowse.types.RANKED_LIST],
            resultSetAvailability: (search.pages > 1) ? 'top' : 'all'
          }
          data.results = []

          for (let img of search.images) {
            let second = img.second;
            let url = this.appCfg.dataServer.url + ':' + this.appCfg.dataServer.port + '/' + this.appCfg.dataServer.keyframesLocation + '/' + window.utils.zeroPad(img.video, 5) + '/' + window.utils.zeroPad(img.video, 5) + '_' + second + '_key.jpg';
            let v = this.utils.videoFromThumbUrl(url);
            v.score = Math.round(img.probability * 100) / 100;
            let result = this.videoToLogResult(v);
            data.results.push(result);
          }
          this.notifyParents(this, 'log-result', data);
        },

        videoToLogResult(vidObj) {
          return {
            video: vidObj.id,
            frame: vidObj.frame.number,
            score: vidObj.score,
            rank: undefined,
            shot: undefined
          };
        },

        logInteractSearch: function(search) {
          let cat = window.logging.logTypes.category.TEXT;
          let net = search.selectedNetwork;
          let cache = search.selectedCache;
          let data  = {
             category: cat.key,
             type: cat.types.CONCEPT,
             value: {
               title: search.title,
               net: net,
               cache: cache,
               range: search.videoRange,
               page: search.page
             }
          }
          this.notifyParents(this, 'log-event', data);
          // console.log("Window: "+ search.id +" SOLR SEARCH: " + search.title);
        },

        fetchSolrSearch: function(search) {
            this.error = this.post = null
            this.loading = true
            let net = search.selectedNetwork;
            let cache = search.selectedCache;

            // log search action
            this.logInteractSearch(search);

            getFromSolr(net, search.title, cache, search.page, (err, response) => {
                this.loading = false
                if (err) {
                    this.error = err.toString();
                } else {
                    search.pages = Math.ceil(response.numFound / 200);
                    search.images = response.docs;
                    this.logCategories(response.docs);

                    // issue result log
                    this.logResult(search);
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
              sObject.page = 1;
              sObject.pages = 1;
              break;
            case window.searchStorage.type.VIDEO_SUMMARY:
              sObject.title = payload.id;
              sObject.video = payload;
              sObject.selectedCache = 1;
              break;
            case window.searchStorage.type.NONE:
            default:
              return null;
        }
        return sObject;
      },
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

function getFromSolr(net, category, cache, page, callback) {
    const Http = new XMLHttpRequest();
    const url = window.appCfg.dbServer.url + ':' + window.appCfg.dbServer.port + '/search/' + net + '/' + category + '/' + cache + '/' + page;

    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange = (e) => {
        if (e.currentTarget.readyState == 4 && e.currentTarget.status == 200) {
            const response = JSON.parse(Http.responseText);

            callback(null, response);
        }
    }
}

</script>
