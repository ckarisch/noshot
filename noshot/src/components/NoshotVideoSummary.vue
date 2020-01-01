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

          // log video summary action
          this.logInteract(video);

          let totalKeyFrames = parseInt(this.appCfg.keyCount[video.id]);
          let s = [];
          let logResults = [];
          for (let i = 0; i < totalKeyFrames; i++) {
            let src = `${keyframeBase}${video.id}/${video.id}_${i}_key.jpg`;
            let v = this.utils.videoFromThumbUrl(src);
            v.second = i;
            let fakeDBResult = this.utils.videoToDBResult(v);
            // push images according to current cache
            if (i % this.search.selectedCache === 0) {
              s.push(fakeDBResult);
              logResults.push(this.videoToLogResult(v));
            }
          }
          // log results
          this.logResult(logResults);
          return s;
        },
        logResult(results) {
          let cat = window.logging.logTypes.category.BROWSE;
          let sliderValue = parseInt(this.$refs.cacheRangeSlider.value);
          let data = {};
          data.info =  {
            usedCategories: [cat.key],
            usedTypes: [cat.types.VID_SUMMARY, cat.types.TEMP_CONTEXT],
            sortType:  [cat.types.TEMP_CONTEXT],
            resultSetAvailability: (sliderValue === 1) ? 'all' : 'top'
          }
          data.results = results;
          this.notifyParents(this, 'log-result', data);
        },
        videoToLogResult(vidObj) {
          return {
            video: vidObj.id,
            frame: vidObj.frame.number,
            score: undefined,
            rank: undefined,
            shot: undefined
          };
        },
        logInteract: function(video) {
          let cat = window.logging.logTypes.category.BROWSE;
          let data  = {
             category: cat.key,
             type: cat.types.VID_SUMMARY,
             value: {
               video: video.id,
               cache: this.search.selectedCache
             }
          }
          this.notifyParents(this, 'log-event', data);
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
          let sliderValueA = parseInt(this.$refs.cacheRangeSlider.value);
          if (this.search.selectedCache !== sliderValueA) {
            this.search.selectedCache = sliderValueA;
          }
          // delay update to prevent overexhaustive reloading and logging
          setTimeout(() => {
            let sliderValueB = parseInt(this.$refs.cacheRangeSlider.value);
            if (sliderValueA !== sliderValueB) return;
            // console.log("issuing cache search " + sliderValueB);
            this.search.images = this.getVideoSummaryImages(this.search.video); // forces re-render
          }, 100);
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
