<template>
  <li>
    <div class="videoSummaryContent">
      I am video summary content of video {{ search.video.id }}.
    </div>
  </li>
</template>

<script>
// import NoshotImage from './NoshotImage.vue'

export default {
    name: 'NoshotVideoSummary',
    components: {
    },
    created() {
      window.log(this.search.video);
    },
    props: {
      search: Object
    },
    data: () => {
      return {
      }
    },

    methods: {


    },

}


</script>
