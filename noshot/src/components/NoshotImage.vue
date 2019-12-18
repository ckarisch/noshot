<template>
  <div>
      <img class="small" v-for="n in generateRange(search.videoRange)" :alt="keyframeSrc(img, (-search.videoRange + n))" :src="keyframeSrc(img, (-search.videoRange + n))" :key="keyframeSrc(img, (-search.videoRange + n)) + '_' + n" />
      <img v-on:click="click" :alt="keyframeSrc(img, 0)" :src="keyframeSrc(img, 0)" />
      <img class="small" v-for="n in generateRange(search.videoRange)" :alt="keyframeSrc(img, n+1)" :src="keyframeSrc(img, n+1)" :key="keyframeSrc(img, n+1) + '_' + n" />

  </div>
</template>

<script>

import submission from '../mixins/submission/submission.js'

export default {
    name: 'NoshotImage',
    props: {
        img: Object,
        search: Object
    },
    data: function () {
        return {
        };
    },
    mixins: [submission],

    watch: {
    },

    filters: {
    },

    computed: {
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
        this.notifyparents(this, 'open-video', video);
      },
      generateRange: function(videoRange) {
        let range = [];
        for(let i = 0; i < videoRange; i++) {
          range[i] = i;
        }
        return range;
      },
      notifyparents(element, msg, object) {
        let parent = element.$parent;
        while(parent) {
          parent.$emit(msg, object);
          parent = parent.$parent;
        }
      }
    },

    // a custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    // http://vuejs.org/guide/custom-directive.html
    directives: {
    },

    mounted: function() {
    }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
