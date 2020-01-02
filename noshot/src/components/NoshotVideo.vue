<template>

    <vue-draggable-resizable class="videoWindow" ref="draggableVideo" :w="draggableWidth" :h="draggableHeight" :x="draggableX" :y="draggableY" :z="1050" :resizable="false" :parent="true" @dragstop="onDragStop" @dragging="onDrag">
      <div class="videoDragBar">
        <button v-on:click="submitFrame" class="frameSubmitButton videoButton" type="button"> <i class="fas fa-paper-plane"></i></button>
        <b>v</b> {{ video.id }} <b>f</b> {{ currentFrame }}
        <button v-on:click="close" class="videoCloseButton videoButton" type="button"><i class="fas fa-window-close"></i></button>
      </div>
      <video ref="videoEl" @canplay="onCanPlay" @timeupdate="onTimeUpdateListener" v-bind:width="videoWidth" controls v-bind:autoplay="videoAutoplay">
        <source v-bind:src="videoURL" type="video/mp4">
        Sorry, your browser doesn't support embedded videos.
      </video>
      <div id="preview">
      </div>
    </vue-draggable-resizable>

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
      let curvidWidth = parseInt(this.appCfg.preferences.load(this.appCfg.preferences.prefKeys.VIDEO.WIDTH, 300));
      this.videoWidth = curvidWidth + "px";
      this.draggableWidth = curvidWidth;
      // this.draggableHeight = curvidWidth;
      this.videoAutoplay = this.appCfg.preferences.isEnabled("videoAutoplay", true);
      this.isDragged = false;
    },
    props: {
        video: Object
    },
    data: function () {
        return {
          draggableX: this.video.pos.x,
          draggableY: this.video.pos.y,
          currentFrame: this.video.frame.number,
          draggableHeight: 10
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
      onDrag: function () {
        this.isDragged = true;
      },
      onDragStop: function () {
        this.isDragged = false;
      },
      close: function() {
        this.$parent.$emit('close-video', this.video);
      },
      onTimeUpdateListener: function() {
        // update current frame
        if (!this.$refs.videoEl) return;
        this.currentFrame = this.utils.secondToFrame(this.$refs.videoEl.currentTime, this.video.frame.fps);
      },
      submitFrame: function() {
        // clone video
        let video_current = JSON.parse(JSON.stringify(this.video));
        if (this.currentFrame !== this.video.frame.number) {
          video_current.frame.number = this.currentFrame;
          video_current.frame.second = this.utils.frameToSecond(this.currentFrame, video_current.frame.fps);
          // get video screenshot (only for confirm = true, since it takes some time)
          if (this.appCfg.preferences.isEnabled("confirmSubmit", true)) {
            let cv = this.utils.copyCanvas(this.$refs.videoEl);
            // let imgUrl = this.utils.getThumb(this.$refs.videoEl);
            video_current.frame.url = null;
            video_current.frame.canvas = cv;
          }
        }
        this.submitConfirm(video_current);
      },
      reset: function() {
        // jump to frame
        let timeCode = this.video.frame.second;
        this.$refs.videoEl.currentTime = timeCode;
        // log interaction
        this.logInteract(this.video);
      },

      logInteract: function(video) {
        let cat = window.logging.logTypes.category.BROWSE;
        let data  = {
           category: cat.key,
           type: cat.types.VID_PLAYER,
           value: {
             video: video.id,
             second: video.frame.second,
             frame: video.frame.number
           }
        }
        this.notifyParents(this, 'log-event', data);
      },

      onCanPlay() {
        // window.log(this.$refs.videoEl.videoWidth);
        // set height according to current video height
        this.draggableHeight = this.$refs.videoEl.offsetHeight + 50;
      }
    },
    // a custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    // http://vuejs.org/guide/custom-directive.html
    directives: {

    },
    mounted: function() {
      this.reset();
    }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
