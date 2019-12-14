<template>
  <!-- <div  > -->

      <!-- <div style="height: 500px; width: 500px; border: 1px solid red; position: absolute;"> -->
      <vue-draggable-resizable class="videoWindow" ref="draggableVideo" :w="draggableWidth" :h="draggableHeight" :x="draggableX" :y="draggableY" :z="1050" :resizable="false" :parent="true" @dragging="onDrag">
        <div class="videoDragBar">
          Drag me
        </div>
        <video ref="videoEl" v-bind:width="videoWidth" controls autoplay>
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
                      this.video.frame.video + '.mp4';
      this.videoWidth = this.appCfg.video.width + "px";
      this.draggableWidth = this.appCfg.video.width;
    },
    props: {
        video: Object,
        draggableHeight: Number
    },
    data: function () {
        return {
          draggableX: this.video.pos.x,
          draggableY: this.video.pos.y,
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
