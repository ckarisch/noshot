<template>
  <li>
    <div class="view">
      <div class="menu">
          <button class="minimize" @click="minimize()"></button>
          <button class="maximize" @click="maximize()"></button>
          <button class="destroy" @click="remove()"></button>
      </div>
      <NoshotSearch v-if="search.type === searchStorage.type.SOLR_SEARCH" :search="search" />
      <NoshotVideoSummary v-if="search.type === searchStorage.type.VIDEO_SUMMARY" :search="search" />
    </div>
  </li>
</template>

<script>
import NoshotSearch from './NoshotSearch.vue'
import NoshotVideoSummary from './NoshotVideoSummary.vue'

export default {
    name: 'NoshotWindow',
    components: {
      NoshotSearch,
      NoshotVideoSummary
    },
    created() {
    },
    props: {
      search: Object,
      searches: Array
    },
    data: () => {
        return {
          searchStorage: window.searchStorage
        }
    },
    methods: {
        addContent: function() {

        },
        minimize: function() {
          this.search.minimized = !this.search.minimized;
          this.search.maximized = false;
        },
        maximize: function() {
          this.search.maximized = !this.search.maximized;
          this.search.minimized = false;
        },
        remove: function() {
          this.searches.splice(this.searches.indexOf(this.search), 1)
        }
    }
}


</script>
