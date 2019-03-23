// Full spec-compliant SearchMVC with localStorage persistence
// and hash-based routing in ~120 effective lines of JavaScript.

// localStorage persistence
var STORAGE_KEY = 'DIVE-layout'
var searchStorage = {
  fetchSearches: function () {
    var searches = JSON.parse(localStorage.getItem(STORAGE_KEY+"_searches") || '[]')
    searches.forEach(function (search, index) {
      search.id = index
      // for(var w in app.data.workspaces) {
      //   if(search.workspace.id == w.id) {
      //     search.workspace = w;
      //   }
      // }
    })
    searchStorage.uid = searches.length
    return searches
  },
  fetchWorkspaces: function () {
    var w = JSON.parse(localStorage.getItem(STORAGE_KEY+"_workspaces") || '[]');
    if (!w || !w.length) {
      w = [{id: 'default', name: 'Workspace 0'}];
    }
    return w;
  },
  save: function (searches) {
    localStorage.setItem(STORAGE_KEY+"_searches", JSON.stringify(searches))
  },
  saveWorkspaces: function (workspaces) {
    localStorage.setItem(STORAGE_KEY+"_workspaces", JSON.stringify(workspaces))
  }
}

var fotos = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];



// visibility filters
var filters = {
  all: function (searches) {
    return searches
  }
}

// app Vue instance
var app = new Vue({
  // app initial state
  data: {
    workspaces: searchStorage.fetchWorkspaces(),
    searches: searchStorage.fetchSearches(),
    newSearch: '',
    newTab: '',
    tabCheck: true,
    editedSearch: null,
    visibility: 'default',
    activeWorkspace: undefined
  },

  // watch searches change for localStorage persistence
  watch: {
    searches: {
      handler: function (searches) {
        searchStorage.save(searches)
      },
      deep: true
    },
    workspaces: {
      handler: function (workspaces) {
        searchStorage.saveWorkspaces(workspaces)
      },
      deep: true
    },
    newTab: {
      handler: function (newTab) {
        this.tabCheck = true;
        for (var w of this.workspaces)
        {
          if ( w.id.toLowerCase() == allowedString(this.newTab).toLowerCase())
          {
            this.tabCheck = false;
          }
        }
      },
      deep: true

    }  },

  // computed properties
  // http://vuejs.org/guide/computed.html
  computed: {
    filteredSearches: function () {
      //return filters[this.visibility](this.searches)
      return this.searches.filter(function (search) {
        return search.workspace == app.visibility || search.workspace == 0 || search.workspace === undefined
        return true
      })
    },
    fotos: function() {
      return fotos
    },
    getWorkspaces: function() {
      return this.workspaces
    },
    all: function () {
      return this.searches.length
    },
    remaining: function () {
      return filters.normal(this.searches).length
    },
    getTabCheck: function () {
      return this.tabCheck
    }
  },

  filters: {
    pluralize: function (n) {
      return n === 1 ? 'item' : 'items'
    }
  },

  // methods that implement data logic.
  // note there's no DOM manipulation here at all.
  methods: {
    addSearch: function () {
      var value = this.newSearch && this.newSearch.trim()
      if (!value) {
        return
      }
      var s = {
        id: searchStorage.uid++,
        title: value,
        frames: true,
        workspace: this.visibility
      }
      this.searches.push(s)
      if(!this.activeWorkspace.searches)
        this.activeWorkspace.searches = [];
      this.activeWorkspace.searches.push(s)
      this.newSearch = ''
    },
    addTab: function() {
      var value = allowedString(this.newTab)
      if (!value) {
        return
      }
      if (!this.tabCheck)
      {
        return;
      }
      this.workspaces.push({ id: value, name: value });

      this.visibility = value;
      window.location.hash = "/" + this.visibility;
      this.newTab = '';
    },
    // checkTabName: function () {
    //   this.tabCheck = true;
    //   for (var w in this.workspaces)
    //   {
    //     console.log( w.id.toLowerCase() + " , " + this.newTab.toLowerCase())
    //     if ( w.id.toLowerCase() == this.newTab.toLowerCase())
    //     {
    //       this.tabCheck = false;
    //     }
    //   }
    // },

    removeSearch: function (search) {
      this.searches.splice(this.searches.indexOf(search), 1)
    },

    removeWorkspace: function (workspace) {

      // for(var s in workspace.searches) {
      //   this.searches.splice(this.searches.indexOf(s), 1)
      // }
      var temp = [];
      for(let search of this.searches) {
        temp.push(search);
      }

      for(var i = 0; i < this.searches.length; i++)
      {
        if(this.searches[i].workspace == workspace.id) {
          this.searches.splice(this.searches.indexOf(this.searches[i]), 1)
          i--;
        }
      }

      this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
      this.visibility = 'default';
    },

    editSearch: function (search) {
      this.beforeEditCache = search.title
      this.editedSearch = search
    },

    doneEdit: function (search) {
      if (!this.editedSearch) {
        return
      }
      this.editedSearch = null
      search.title = search.title.trim()
      if (!search.title) {
        this.removeSearch(search)
      }
    },

    cancelEdit: function (search) {
      this.editedSearch = null
      search.title = this.beforeEditCache
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
})

// handle routing
function onHashChange () {
  var visibility = window.location.hash.replace(/#\/?/, '')
  app.visibility = 'default'

  for(var w of app.workspaces)
  {
    if(w.id == visibility)
    {
      app.visibility = visibility;
      app.activeWorkspace = w;
    }
  }
  if( app.visibility == 'default') {
    window.location.hash = ''
  }

  // if (filters[visibility] || app.workspaces[visibility]) {
  //   app.visibility = visibility
  // } else {
  //   window.location.hash = ''
  //   app.visibility = 'all'
  // }
}

function allowedString(input) {
  var out = input.trim();
  out = out.replace(/ +/g, "_");
  out = out.replace(/!(A-Za-z_-)/g, "");
  return out;
};

window.addEventListener('hashchange', onHashChange)
onHashChange()

// mount
app.$mount('.app')
