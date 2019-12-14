<template>
  <!-- <div  > -->

      <!-- <div style="height: 500px; width: 500px; border: 1px solid red; position: absolute;"> -->
      <vue-draggable-resizable class="videoWindow" ref="draggableVideo" :w="draggableWidth" :h="draggableHeight" :x="draggableX" :y="draggableY" :z="1050" :resizable="false" :parent="true" @dragging="onDrag">
        <div class="videoDragBar">
          v {{ video.id }} f {{ currentFrame }} <button v-on:click="close" class="videoCloseButton" type="button"><i class="fas fa-window-close"></i></button>
        </div>
        <video ref="videoEl" @timeupdate="onTimeUpdateListener" v-bind:width="videoWidth" controls v-bind:autoplay="videoAutoplay">
          <source v-bind:src="videoURL" type="video/mp4">
          Sorry, your browser doesn't support embedded videos.
        </video>
      </vue-draggable-resizable>
    <!-- </div> -->

  <!-- </div> -->
</template>

<script>

import submission from '../mixins/submission/submission.js'
// import VueDraggableResizable from 'vue-draggable-resizable'

export default {
    name: 'NoshotVideo',
    created() {
      this.videoURL = this.appCfg.dataServer.url + ':' +
                      this.appCfg.dataServer.port + '/' +
                      this.appCfg.dataServer.videosLocation + '/' +
                      this.video.id + '.mp4';
      this.videoWidth = this.appCfg.video.width + "px";
      this.draggableWidth = this.appCfg.video.width;
      this.videoAutoplay = this.appCfg.preferences.isEnabled("videoAutoplay", true);
    },
    props: {
        video: Object,
        draggableHeight: Number
    },
    data: function () {
        return {
          draggableX: this.video.pos.x,
          draggableY: this.video.pos.y,
          currentFrame: this.video.frame.number
          // draggableHeight: this.$refs.videoEl.width
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
      click: function(event) {
        window.log(event);
      },
      onDrag: function () {

      },
      close: function() {
        this.$parent.$emit('close-video', this.video);
      },
      onTimeUpdateListener: function() {
        // update current frame
        if (!this.$refs.videoEl) return;
        this.currentFrame = this.utils.secondToFrame(this.$refs.videoEl.currentTime, this.video.frame.fps);
      }
    },

    // a custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    // http://vuejs.org/guide/custom-directive.html
    directives: {

    },

    mounted: function() {
      // jump to frame
      let timeCode = this.video.frame.second;
      this.$refs.videoEl.currentTime = timeCode;
    }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
