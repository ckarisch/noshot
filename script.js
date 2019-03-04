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

// visibility filters
var filters = {
  all: function (searches) {
    return searches
  },
  active: function (searches) {
    return searches.filter(function (search) {
      return !search.hidden
    })
  },
  hidden: function (searches) {
    return searches.filter(function (search) {
      return search.hidden
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
    remaining: function () {
      return filters.active(this.searches).length
    },
    allDone: {
      get: function () {
        return this.remaining === 0
      },
      set: function (value) {
        this.searches.forEach(function (search) {
          search.hidden = value
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
        hidden: false
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

    removeHidden: function () {
      this.searches = filters.active(this.searches)
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
