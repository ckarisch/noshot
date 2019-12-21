<template>
  <li>
    <div class="videoSummaryContent">
      <div class="videoSummaryControls">
        I am video summary content of video {{ search.video.id }}.
      </div>
      <div :class="{ showFrames: true, resultContainer: true }">
          <div>
              <div v-for="img in search.images" :key="search.id + '_' + img.video + '_' + img.second" :data="search.id + '_' + img.video + '_' + img.second" >
                  <NoshotImage :searchToolSettings="searchToolSettings" :search="search" :img="img"/>
                  <!-- <span class="imageDescription"><strong>{{img.categoryName}}</strong> <br/>Parent: <strong>{{img.parentName}}</strong> <br/>Confidence: <strong>{{Math.round(img.probability * 100) / 100}}</strong></span> -->
              </div>
          </div>
      </div>
    </div>
    <!-- <img ref="testimg" @error="errorLoading"/> -->
  </li>
</template>

<script>
import NoshotImage from './NoshotImage.vue'

export default {
    name: 'NoshotVideoSummary',
    created() {
    },
    components: {
      NoshotImage
    },
    props: {
      search: Object,
      searchToolSettings: Object
    },
    data: () => {
      return {
        // errorLoading: (e) => {this.errorLoading(e)}

      }
    },

    methods: {

    },
    mounted: function() {

    }

}


</script>
