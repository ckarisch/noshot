// localStorage persistence
var STORAGE_KEY = 'DIVE-layout'
var SearchStorage = {
    fetchSearches: function() {
        var searches = JSON.parse(localStorage.getItem(STORAGE_KEY + "_searches") || '[]');
        searches.forEach(function(search, index) {
            search.id = index;
        })
        SearchStorage.uid = searches.length;
        return searches;
    },
    save: function(searches) {
        localStorage.setItem(STORAGE_KEY + "_searches", JSON.stringify(searches));
    }
};

SearchStorage.type = {
    SOLR_SEARCH: "solr_search",
    VIDEO_SUMMARY: "video_summary",
    NONE: "none",
};

export default SearchStorage;
