import Vue from 'vue';
import App from './App.vue';
import config from '../public/config/default.json'; // default app cfg
import utils from './utils/utils.js';

/** 3rd party plugins **/
// https://www.npmjs.com/package/@fortawesome/fontawesome-free
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.js';
// https://www.npmjs.com/package/vue-toastr
import VueToastr from "vue-toastr";
// https://www.npmjs.com/package/vuejs-dialog
import VuejsDialog from 'vuejs-dialog';
import '../node_modules/vuejs-dialog/dist/vuejs-dialog.min.css';
// https://ej2.syncfusion.com/vue/documentation/sidebar/getting-started/#getting-started
import { SidebarComponent, SidebarPlugin } from '@syncfusion/ej2-vue-navigations';
import { ButtonPlugin } from '@syncfusion/ej2-vue-buttons';
Vue.component(SidebarPlugin.name, SidebarComponent);
import '../node_modules/@syncfusion/ej2-base/styles/material.css';
import '../node_modules/@syncfusion/ej2-vue-navigations/styles/material.css';
import '../node_modules/@syncfusion/ej2-buttons/styles/material.css';


// plugins
Vue.use(VueToastr, {
  /* OverWrite Plugin Options if you need */
  preventDuplicates: true // default is false
});
Vue.use(VuejsDialog);
Vue.use(SidebarPlugin);
Vue.use(ButtonPlugin);

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
  }).$mount('#app');
}
