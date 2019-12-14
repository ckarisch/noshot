import Vue from 'vue'
import App from './App.vue'
import config from '../public/config/default.json' // default app cfg
import utils from './utils/utils.js'
import VueToastr from "vue-toastr";
// import VuejsDialog from 'vuejs-dialog';

// plugins
Vue.use(VueToastr, {
  /* OverWrite Plugin Options if you need */
  preventDuplicates: true // default is false
});
// Vue.use(VuejsDialog);

// global cfg
window.appCfg = config; // cfg (for non VUE components)
// global logging for debugging
window.log = utils.debugLog;

// local cfg
// try getting local cfg ('public' is served under serverurl:port/)
fetch('./config/local.json', {
    method: "GET"
  })
  .then(r => r.json()).then(json => {
    // override keys set in local cfg
    utils.updateJSONRecursive(window.appCfg, json);


  }, json => {
    // not found / unexpected error
    let msg = `Local config: ${JSON.stringify(json)}`;
    window.log(msg);

}).finally( () => {
    // launch app in any case
    initApp();
});

// creates VUE app
function initApp() {
  // set globals (cfg, utils) for all vue components as a global mixins
  // https://stackoverflow.com/questions/40896261/apply-global-variable-to-vuejs
  Vue.mixin({
    data: function () {
      return  {
        appCfg: window.appCfg,
        utils: utils
      }
    }
  });

  Vue.config.productionTip = false

  new Vue({
    render: h => h(App)
  }).$mount('#app')
}
