// Full spec-compliant SearchMVC with localStorage persistence
// and hash-based routing in ~120 effective lines of JavaScript.

// localStorage persistence
var STORAGE_KEY = 'DIVE-layout'
var searchStorage = {
  fetch: function () {
    var searches = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    searches.forEach(function (search, index) {
      search.id = index
    })
    searchStorage.uid = searches.length
    return searches
  },
  save: function (searches) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  }
}

var fotos = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

// visibility filters
var filters = {
  all: function (searches) {
    return searches
  },
  normal: function (searches) {
    return searches.filter(function (search) {
      return !search.marked
    })
  },
  marked: function (searches) {
    return searches.filter(function (search) {
      return search.marked
    })
  }
}

// app Vue instance
var app = new Vue({
  // app initial state
  data: {
    searches: searchStorage.fetch(),
    newSearch: '',
    editedSearch: null,
    visibility: 'all'
  },

  // watch searches change for localStorage persistence
  watch: {
    searches: {
      handler: function (searches) {
        searchStorage.save(searches)
      },
      deep: true
    }
  },

  // computed properties
  // http://vuejs.org/guide/computed.html
  computed: {
    filteredSearches: function () {
      return filters[this.visibility](this.searches)
    },
    fotos: function() {
      return fotos
    },
    all: function () {
      return this.searches.length
    },
    remaining: function () {
      return filters.normal(this.searches).length
    },
    marked: function () {
      return filters.marked(this.searches).length
    },
    allDone: {
      get: function () {
        return this.remaining === 0
      },
      set: function (value) {
        this.searches.forEach(function (search) {
          search.marked = value
        })
      }
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
      this.searches.push({
        id: searchStorage.uid++,
        title: value,
        marked: false,
        frames: true
      })
      this.newSearch = ''
    },

    removeSearch: function (search) {
      this.searches.splice(this.searches.indexOf(search), 1)
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
    },

    removeMarked: function () {
      this.searches = filters.normal(this.searches)
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
  if (filters[visibility]) {
    app.visibility = visibility
  } else {
    window.location.hash = ''
    app.visibility = 'all'
  }
}

window.addEventListener('hashchange', onHashChange)
onHashChange()

// mount
app.$mount('.app')
