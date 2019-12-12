<template>
  <div id="app" class="app">
    <SearchTool msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import SearchTool from './components/SearchTool.vue'
import './scss/main/style.scss'


export default {
  name: 'app',
  components: {
    SearchTool
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
