import Vue from 'vue';
import App from './App.vue';
import config from '../public/config/default.json'; // default app cfg
import fps from '../public/config/fps.json';
import keyCount from '../public/config/keyCount.json';
import categoryNames from '../public/config/categoryNames.json';
import { saveAs } from 'file-saver';
import utils from './utils/utils.js';
import Preferences from './utils/Preferences.js';
import SearchStorage from './utils/SearchStorage.js';
import globalMixin from './mixins/globalMixin.js';
import ActionLogger from './utils/logging/ActionLogger.js';

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
// https://www.npmjs.com/package/vue-draggable-resizable
import VueDraggableResizable from 'vue-draggable-resizable'
Vue.component('vue-draggable-resizable', VueDraggableResizable)
// https://www.npmjs.com/package/v-tooltip
import VTooltip from 'v-tooltip';


// plugins
Vue.use(VueToastr, {
  /* OverWrite Plugin Options if you need */
  preventDuplicates: true // default is false
});
Vue.use(VuejsDialog);
Vue.use(SidebarPlugin);
Vue.use(ButtonPlugin);
let tooltipOptions = {
    // Default tooltip placement relative to target element
    defaultPlacement: 'top',
    // Default CSS classes applied to the tooltip element
    defaultClass: 'vue-tooltip-theme'
}
Vue.use(VTooltip, tooltipOptions);


// global cfg
window.appCfg = config; // cfg (for non VUE components)
window.appCfg.preferences = Preferences;
window.searchStorage = SearchStorage;
window.appCfg.fps = fps;
window.appCfg.keyCount = keyCount;
window.appCfg.categoryNames = categoryNames;
// utils
window.utils = utils;
window.utils.saveAs = saveAs;
// global logging for debugging
window.log = utils.debugLog;

// file-save usage
// var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});
// window.utils.saveAs(blob, "hello world.txt");

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

// logging
window.logging = {}
window.logging.actionLogger = new ActionLogger(window.appCfg.vbsServer.teamName, window.appCfg.vbsServer.teamId, window.appCfg.vbsServer.memberId);


// creates VUE app
function initApp() {
  // set globals (cfg, utils) for all vue components as a global mixins
  // https://stackoverflow.com/questions/40896261/apply-global-variable-to-vuejs
  Vue.mixin({
    data: function() {
      return  {
        appCfg: window.appCfg,
        utils: utils
      }
    },
    // methods: globalMixinMethods
  });
  Vue.mixin(globalMixin);

  Vue.config.productionTip = false;

  new Vue({
    render: h => h(App)
  }).$mount('#app');
}
