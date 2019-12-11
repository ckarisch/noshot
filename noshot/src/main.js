import Vue from 'vue'
import App from './App.vue'
import config from '../public/config/default.json' // default app cfg

// global cfg
window.appCfg = config; // cfg (for non VUE components)

// local cfg
// try getting local cfg ('public' is served under serverurl:port/)
fetch('./config/local.json', {
    method: "GET"
  })
  .then(r => r.json()).then(json => {
    // override keys set in local cfg
    updateJSONRecursive(window.appCfg, json);
    // launch app
    initApp();
  }, json => {
    // not found / unexpected error
    let msg = `Local config: ${json}`;
    // eslint-disable-next-line no-console
    console.log(msg);
  })
// updates parts of default cfg according to local cfg
function updateJSONRecursive(jsonPart, updatePart) {
  if (Object.keys(jsonPart).length === 0) return;
  if (Object.keys(updatePart).length === 0) return;
  for (let key in updatePart) {
    if (typeof updatePart[key] === 'object' &&
      Object.keys(updatePart[key]).length > 0 &&
      Object.keys(jsonPart[key].length > 0)) {
      updateJSONRecursive(jsonPart[key], updatePart[key]);
    } else if (jsonPart[key] !== updatePart[key]) {
      // eslint-disable-next-line no-console
      console.log(`[config override] ${key}: ${jsonPart[key]} => ${updatePart[key]}`);
      jsonPart[key] = updatePart[key];
    }
  }
}

// creates VUE app
function initApp() {
  // set updated cfg for all vue components as a global mixin
  // https://stackoverflow.com/questions/40896261/apply-global-variable-to-vuejs
  Vue.mixin({
    data: function () {
      return  {
        appCfg: window.appCfg
      }
    }
  });
  
  Vue.config.productionTip = false

  new Vue({
    render: h => h(App)
  }).$mount('#app')
}
