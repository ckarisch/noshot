<template>
  <div>
      <img class="preview" v-if="!search.frames" :alt="keyframeSrc(img, -1)" :src="keyframeSrc(img, -1)" />
      <img v-on:click="click" :alt="keyframeSrc(img, 0)" :src="keyframeSrc(img, 0)" />
      <img class="preview" v-if="!search.frames" :alt="keyframeSrc(img, 1)" :src="keyframeSrc(img, 1)" />

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
      keyframeSrc: function(img) {
          let second = img.second;
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

      submitFrame: function(event, confirm=this.appCfg.preferences.isEnabled("confirmSubmit", true)) {

        let imgUrl = event.target.src;
        let video = this.utils.videoFromThumbUrl(imgUrl);
        if (Object.keys(video).length === 0) return;

        // let style ="display: block;margin-left: auto;margin-right: auto;width: 50%;"
        let imgTag = `<img style='width:100%;' src='${event.target.src}' />`;

        // Trigger a confirmation dialog
        if (confirm) {
          this.$dialog
            .confirm(`<div class="confirm_submission">
                        <div>Confirm submission of</div>
                        <div class='confirm_image'> ${imgTag}</div>
                        <div>v ${video.id} f ${video.frame.number}</div>
                      </div>`,
              {html: true})
            .then(() => {
              window.log('Clicked on proceed');
              this.submit(video.id, video.frame.number);
            })
            .catch(() => {
              window.log('submission cancelled');
            });
        }
        else this.submit(video.id, video.frame.number);
      },

      openVideo(event) {
        let imgUrl = event.target.src;
        let video = this.utils.videoFromThumbUrl(imgUrl);
        if (Object.keys(video).length === 0) return;
        this.$parent.$emit('open-video', video);
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
