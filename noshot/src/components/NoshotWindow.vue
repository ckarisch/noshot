<template>
  <li>
    <div class="view">
      <div class="menu">
          <button class="minimize" @click="minimize()"></button>
          <button class="maximize" @click="maximize()"></button>
          <button class="destroy" @click="remove()"></button>
      </div>
      <div v-tooltip.bottom-center="tooltips.bulkSubmit" class="bulkSubmission">
        <button type="button" name="button" @click="fireSubmitAll"><i class="fab fa-2x fa-stack-overflow"></i></button>
      </div>
      <NoshotSearch :searchToolSettings="searchToolSettings" v-if="search.type === searchStorage.type.SOLR_SEARCH" :search="search" />
      <NoshotVideoSummary :searchToolSettings="searchToolSettings" v-if="search.type === searchStorage.type.VIDEO_SUMMARY" :search="search" />
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
      searchToolSettings: Object
    },
    data: () => {
        return {
          searchStorage: window.searchStorage,
          tooltips: {
            bulkSubmit: "Submit page"
          }
        }
    },
    methods: {
        addContent: function() {

        },
        minimize: function() {
          this.notifyParents(this, 'minimize-window', this.search);
        },
        maximize: function() {
          this.notifyParents(this, 'maximize-window', this.search);
        },
        remove: function() {
          this.notifyParents(this, 'remove-window', this.search);
        },
        fireSubmitAll: function() {
          this.notifyParents(this, 'fire-submit-all', this.search);
        }

    }
}


</script>
