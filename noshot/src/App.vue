<template>
  <div id="app" class="app">
    <NoshotWorkspace />
  </div>
</template>

<script>
import Vue from 'vue'
import VueSuggestion from 'vue-suggestion'
import Paginate from 'vuejs-paginate'
import NoshotWorkspace from './components/NoshotWorkspace.vue'
import './scss/main/style.scss'


Vue.use(VueSuggestion);
Vue.component('paginate', Paginate)

export default {
  name: 'app',
  components: {
    NoshotWorkspace
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
