import Vue from 'vue'
import App from './App.vue'
import config from '../config/default.json'
import configLocal from '../config/local.json'

// app config
const localCfg = configLocal;
window.appCfg = config
if (Object.keys(localCfg).length > 0) {
  // TODO parse local cfg
}

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
