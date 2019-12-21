<template>
  <div>
      <img :style="keyframeStyle" class="small" v-for="n in generateRange(search.videoRange)" :alt="keyframeSrc(img, (-search.videoRange + n))" :src="keyframeSrc(img, (-search.videoRange + n))" :key="keyframeSrc(img, (-search.videoRange + n)) + '_' + n" />
      <img :style="keyframeStyle" v-on:click="click" :alt="keyframeSrc(img, 0)" :src="keyframeSrc(img, 0)" />
      <img :style="keyframeStyle" class="small" v-for="n in generateRange(search.videoRange)" :alt="keyframeSrc(img, n+1)" :src="keyframeSrc(img, n+1)" :key="keyframeSrc(img, n+1) + '_' + n" />

  </div>
</template>

<script>

import submission from '../mixins/submission/submission.js'

export default {
    name: 'NoshotImage',
    props: {
        img: Object,
        search: Object,
        searchToolSettings: Object
    },
    data: function () {
        return {
        };
    },
    mixins: [submission],

    // watch searches change for localStorage persistence
    // watch: {
    //     searches: {
    //         handler: function(searches) {
    //             window.searchStorage.save(searches)
    //         },
    //         deep: true
    //     }
    // },

    filters: {
    },

    computed: {
      keyframeStyle: function() {
        return { "max-width": 100/(this.search.videoRange * 2 + 1) + "%", width: this.searchToolSettings.imageSize + "px" };
      }
    },

    methods: {
      keyframeSrc: function(img, shift = 0) {
          let second = img.second;
          second = parseInt(second) + parseInt(shift);
          if(second < 0) second = 0;
          // return 'http://localhost:80/keyframes/'+ this.pad(img.video, 5) + '/' + this.pad(img.video, 5) + '_' + second + '_key.jpg';
          return this.appCfg.dataServer.url + ':' + this.appCfg.dataServer.port + '/' + this.appCfg.dataServer.keyframesLocation + '/' + this.pad(img.video, 5) + '/' + this.pad(img.video, 5) + '_' + second + '_key.jpg';
      },
      pad: function(num, size) {
          var s = num + "";
          while (s.length < size) s = "0" + s;
          return s;
      },
      click: function(event) {
        if (event.shiftKey) this.openVideo(event);
        else if(event.ctrlKey) this.openVideoSummary(event);
        else this.submitFrame(event);
      },

      submitFrame: function(event) {

        let imgUrl = event.target.src;
        let video = this.utils.videoFromThumbUrl(imgUrl);
        if (Object.keys(video).length === 0) return;

        this.submitConfirm(video);
      },
      openVideo(event) {
        let imgUrl = event.target.src;
        let video = this.utils.videoFromThumbUrl(imgUrl);
        if (Object.keys(video).length === 0) return;
        this.notifyParents(this, 'open-video', video);
      },
      openVideoSummary(event) {
        let imgUrl = event.target.src;
        let video = this.utils.videoFromThumbUrl(imgUrl);
        if (Object.keys(video).length === 0) return;
        this.notifyParents(this, 'open-video-summary', video);
      },
      generateRange: function(videoRange) {
        let range = [];
        for(let i = 0; i < videoRange; i++) {
          range[i] = i;
        }
        return range;
      }
    },
    mounted: function() {
    }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
