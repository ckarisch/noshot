<template>
  <div>
      <img class="preview" v-if="!search.frames" :alt="keyframeSrc(img, -1)" :src="keyframeSrc(img, -1)" />
      <img :alt="keyframeSrc(img, 0)" :src="keyframeSrc(img, 0)" />
      <img class="preview" v-if="!search.frames" :alt="keyframeSrc(img, 1)" :src="keyframeSrc(img, 1)" />
  </div>
</template>

<script>

export default {
    name: 'NoshotImage',
    props: {
        img: Object,
        search: Object
    },
    data: () => {
        return {
        };
    },

    watch: {
    },

    filters: {
    },

    computed: {
    },

    methods: {
      keyframeSrc: function(img) {
          let second = img.second;
          return 'http://localhost:80/keyframes/' + this.pad(img.video, 5) + '/' + this.pad(img.video, 5) + '_' + second + '_key.jpg';
      },
      pad: function(num, size) {
          var s = num + "";
          while (s.length < size) s = "0" + s;
          return s;
      },
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
