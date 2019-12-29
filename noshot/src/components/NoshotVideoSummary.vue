<template>
  <li>
    <div class="videoSummaryContent">
      <div class="videoSummaryControls">
        <div class="videoSummaryInfo">
          <div>Video summary</div>
          <input v-tooltip.top-center="tooltips.videoInput" type="number" ref="vidInput" :value="displayVideoId" min="1" :max="Object.keys(appCfg.keyCount).length + 1" @change="changeVideo" />
        </div>
        <div class="slidecontainer" v-tooltip.top-center="tooltips.cache">
          cache ({{ search.selectedCache }})
          <input ref="cacheRangeSlider" type="range" min="1" max="180" :value="search.selectedCache" class="slider" @input="updateCacheRange">
        </div>
        <div>{{ search.images.length }} results.</div>
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
        if (this.search.images.length === 0) {
            this.search.images = this.getVideoSummaryImages(this.search.video);
        }
        this.displayVideoId = this.search.title;
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
        componentKey: 0,
        tooltips: {
          videoInput: "Enter video ID",
          cache: "Select seconds interval"
        }
        // errorLoading: (e) => {this.errorLoading(e)}
      }
    },
    methods: {
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
            // push images according to current cache
            if (i % this.search.selectedCache === 0) s.push(fakeDBResult);
          }
          return s;
        },
        changeVideo: function() {
          let inputNumber = parseInt(this.$refs.vidInput.value);
          if (Number.isNaN(inputNumber)) inputNumber = parseInt(this.search.title);
          if (inputNumber < this.$refs.vidInput.min) inputNumber = parseInt(this.$refs.vidInput.min);
          if (inputNumber > this.$refs.vidInput.max) inputNumber = parseInt(this.$refs.vidInput.max);
          let inputString = String(inputNumber);
          let inputStringPadded = inputString.padStart(5, '0');

          // update number input (zero padded)
          this.$refs.vidInput.value = inputStringPadded;

          // update search if video id changed
          if (this.search.id !== inputStringPadded) {
            let firstSecondUrl = this.utils.thumbUrlFromVideoPosition(inputStringPadded, 0);
            let newVideo = this.utils.videoFromThumbUrl(firstSecondUrl);
            this.search.title = newVideo.id;
            this.search.video = newVideo;
            // this.search.selectedCache = 1; // TODO get current cache
            // this.search.images = this.getVideoSummaryImages(this.search.video);
            this.displayVideoId = this.search.title;
            this.search.images = this.getVideoSummaryImages(this.search.video); // forces re-render imgs
          }
        },
        updateCacheRange: function() {
          let sliderValue = parseInt(this.$refs.cacheRangeSlider.value);
          if (this.search.selectedCache !== sliderValue) {
            this.search.selectedCache = sliderValue;
            this.search.images = this.getVideoSummaryImages(this.search.video); // forces re-render
          }
        }
    },
    mounted: function() {
      if (this.search.title != this.search.video.id) {
        // search has been modified in minimized mode
        this.changeVideo();
      }
    }

}


</script>
