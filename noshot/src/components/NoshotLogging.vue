<template>
  <div id="logOverlay">
    <button v-on:click="toggleLogging" class="toggleLogButton" type="button" name="button"><i class="fas fa-power-off"></i></button>
    <div class="timedisplay">Log Overlay!</div>

    <button class="logButton" type="button" name="button"><i class="far fa-save"></i></button>
    <button class="logButton" type="button" name="button"><i class="far fa-trash-alt"></i></button>


  </div>
</template>

<script>
export default {
  name: 'NoshotLogging',
  created() {
  },
  data: () => {
      return {
      };
  },
  props: {
  },
  methods: {
    toggleLogging: function () {
      console.log("disable logging");
    }
  }
}
</script>
