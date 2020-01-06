<template>
  <div>
      <img :style="keyframeStyle" class="small" v-for="n in generateRange(search.videoRange)" :src="keyframeSrc(img, (-search.videoRange + n))" :key="keyframeSrc(img, (-search.videoRange + n)) + '_' + n" />
      <img :style="keyframeStyle" :class="{clicked: clicked}" v-on:click="click($event)" :src="keyframeSrc(img, 0)" :video="img.video" />
      <img :style="keyframeStyle" class="small" v-for="n in generateRange(search.videoRange)" :src="keyframeSrc(img, n+1)" :key="keyframeSrc(img, n+1) + '_' + n" />

  </div>
</template>

<script>

import submission from '../mixins/submission/submission.js'

export default {
    name: 'NoshotImage',
    props: {
        img: Object,
        search: Object,
        searchToolSettings: Object,
        clicked: Boolean
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
        this.clicked = true;
        if (event.shiftKey) this.openVideo(event);
        else if(event.ctrlKey) this.openVideoSummary(event);
        else if(event.altKey) this.excludeVideo(event);
        else this.submitFrame(event);
      },

      submitFrame: function(event) {

        let imgUrl = event.target.src;
        let video = this.utils.videoFromThumbUrl(imgUrl);
        if (Object.keys(video).length === 0) return;

        this.submitConfirm(video);
      },
      excludeVideo: function(event) {

        let video = event.target.attributes.video.value;
        if(!this.search.excludeVideos.includes(video))
            this.search.excludeVideos.push(video);
        
        this.notifyParents(this, 'fetch-solr-search', this.search);
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
