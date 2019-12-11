<template>
<div>
    <div class="header">
        <div class="tabs">
            <ul class="">
                <li v-for="w of workspaces" v-bind:key="w.id" :class="{ tab: true, selected: visibility == w.id }">
                    <a :href="'#/' + w.id">{{ w.id }}</a>
                    <div class="menu">
                        <button v-if="w.id != 'default'" class="destroy" @click="removeWorkspace(w)">X</button>
                    </div>
                </li>
                <li class="tab new"><input href="#" :class="{green: getTabCheck, red: !getTabCheck}" placeholder="new tab" v-model="newTab" @keyup.enter="addTab" /></li>
            </ul>
        </div>

        <input v-if="typeof activeWorkspace !== 'undefined'" class="new-search" autofocus autocomplete="off" placeholder="enter new search" v-model="newSearch" @keyup.enter="addSearch">
    </div>
    <section v-if="typeof activeWorkspace !== 'undefined'" class="main" v-show="searches.length" v-cloak>
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
                    <div class="menu">
                        <button class="minimize" @click="minimizeSearch(search)"></button>
                        <button class="maximize" @click="maximizeSearch(search)"></button>
                        <button class="destroy" @click="removeSearch(search)"></button>
                    </div>
                    <div class="searchNavigation">
                        <input placeholder="Suchbegriff" v-model="search.title" @keyup="fetchSolrSearch(search)" />
                        <select v-model="search.selectedNetwork" @change="fetchSolrSearch(search)">
                            <option v-for="net in nets" v-bind:key="net.name">{{ net }}</option>
                        </select>
                        <select v-model="search.selectedCache" @change="fetchSolrSearch(search)">
                            <option v-for="cache in caches" v-bind:key="cache">{{ cache }}</option>
                        </select>
                        <div class="radiobuttons">
                            <label class="radiobutton">
                                <input type="radio" v-model="search.frames" :name="search.id" :checked="search.frames" value="1">
                                <span class="iconmark icon-frames"></span>
                            </label>

                            <label class="radiobutton">
                                <input type="radio" v-model="search.frames" :name="search.id" :checked="!search.frames" value="">
                                <span class="iconmark icon-scene"></span>
                            </label>
                        </div>
                    </div>
                    <div :class="{ showFrames: search.frames, resultContainer: true }">
                        <div>
                            <div v-for="img in search.images" v-bind:key="img.video + '_' + img.second">
                                <NoshotImage :search="search" :img="img"/>
                            </div>


                        </div>
                    </div>
                </div>
                <input class="edit" type="text" v-model="search.title" v-search-focus="search == editedSearch" @blur="doneEdit(search)" @keyup.enter="doneEdit(search)" @keyup.esc="cancelEdit(search)">
            </li>
        </ul>
    </section>
    <div class="footer" v-show="searches.length" v-cloak>
        <span class="search-count">
            Searches: <strong>{{ all }}</strong>
        </span>
    </div>
</div>
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
    fetchWorkspaces: function() {
        var w = JSON.parse(localStorage.getItem(STORAGE_KEY + "_workspaces") || '[]');
        // if (!w || !w.length) {
        //   w = [{id: 'default', name: 'Workspace 0'}];
        // }
        return w;
    },
    save: function(searches) {
        localStorage.setItem(STORAGE_KEY + "_searches", JSON.stringify(searches))
    },
    saveWorkspaces: function(workspaces) {
        localStorage.setItem(STORAGE_KEY + "_workspaces", JSON.stringify(workspaces))
    }
}

export default {
    name: 'SearchTool',
    components: {
      NoshotImage
    },
    props: {
        msg: String
    },
    data: () => {
        return {
            workspaces: searchStorage.fetchWorkspaces(),
            searches: searchStorage.fetchSearches(),
            newSearch: '',
            newTab: '',
            tabCheck: true,
            editedSearch: null,
            visibility: 'default',
            activeWorkspace: undefined,
            selectedNetwork: 'cnn_googleyolo',
            nets: ['cnn_yolo'],
            caches: [1, 10],
            loading: false,
            post: null,
            error: null
        };
    },

    // watch searches change for localStorage persistence
    watch: {
        searches: {
            handler: function(searches) {
                searchStorage.save(searches)
            },
            deep: true
        },
        workspaces: {
            handler: function(workspaces) {
                searchStorage.saveWorkspaces(workspaces)
            },
            deep: true
        },
        newTab: {
            handler: function() {
                this.tabCheck = true;
                for (var w of this.workspaces) {
                    if (w.id.toLowerCase() == allowedString(this.newTab).toLowerCase()) {
                        this.tabCheck = false;
                    }
                }
            },
            deep: true

        }
    },


    filters: {
        pluralize: function(n) {
            return n === 1 ? 'item' : 'items'
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
        getWorkspaces: function() {
            return this.workspaces
        },
        all: function() {
            return this.searches.length
        },
        getTabCheck: function() {
            return this.tabCheck
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
                selectedNetwork: this.nets[0]
            }
            this.searches.push(s);

            if (!this.activeWorkspace.searches)
                this.activeWorkspace.searches = [];
            this.activeWorkspace.searches.push(s);
            this.newSearch = '';

            this.fetchSolrSearch(s);

        },
        addTab: function() {
            var value = allowedString(this.newTab)
            if (!value) {
                return
            }
            if (!this.tabCheck) {
                return;
            }
            this.workspaces.push({
                id: value,
                name: value
            });

            this.visibility = value;
            window.location.hash = "/" + this.visibility;
            this.newTab = '';
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

        removeWorkspace: function(workspace) {
            var temp = [];
            for (let search of this.searches) {
                temp.push(search);
            }

            for (var i = 0; i < this.searches.length; i++) {
                if (this.searches[i].workspace == workspace.id) {
                    this.searches.splice(this.searches.indexOf(this.searches[i]), 1)
                    i--;
                }
            }

            this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
            // this.visibility = 'default';
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
                // console.log("%ccategories found:", "color: #b00;");
                // for(c in categories)
                //   console.log(c);
            }
        },

        // handle routing
        onHashChange: function() {
            var hash = window.location.hash.replace(/#\/?/, '')
            // app.visibility = 'default'

            for(var w of this.workspaces)
            {
                if(w.id == hash)
                {
                    this.visibility = hash;
                    this.activeWorkspace = w;
                }
            }
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
    },

    mounted: function() {
        window.addEventListener('hashchange', this.onHashChange)
        this.onHashChange()
    }
}

function getFromSolr(net, category, cache, callback) {
    const Http = new XMLHttpRequest();
    const url = 'http://' + location.hostname + ':3000/search/' + net + '/' + category + '/' + cache;

    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange = (e) => {
        if (e.currentTarget.readyState == 4 && e.currentTarget.status == 200) {
            callback(null, JSON.parse(Http.responseText));
        }
    }
}

function allowedString(input) {
    var out = input.trim();
    out = out.replace(/ +/g, "_");
    out = out.replace(/!(A-Za-z_-)/g, "");
    return out;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
    margin: 40px 0 0;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    display: inline-block;
    margin: 0 10px;
}

a {
    color: #42b983;
}
</style>
