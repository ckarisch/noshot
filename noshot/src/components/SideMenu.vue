<template>
  <ejs-sidebar id="default-sidebar" ref="sidebar" :type="type" :target="target" :enableGestures="enableGestures" :position="position" :enablePersistence="enablePersistence">
      <div class="menu-title"> Options </div>
       <div class="menu-sub-title"> Submission </div>
       <div class='menu-option'><input type="checkbox" v-bind:checked="confirmSubmit" prefKey="confirmSubmit" v-on:click="togglePreference"> <span>confirm submissions</span></div>
       <div class="menu-sub-title"> Videos </div>
       <div class='menu-option'><input type="checkbox" v-bind:checked="videoAutoplay" prefKey="videoAutoplay" v-on:click="togglePreference"> <span>autoplay</span></div>
       <div class='menu-option'><span>Width</span> <input type="number" prefKey="videoWidth" :value="videoWidth" @change="togglePreference" @keyup="togglePreference" /></div>
       <div class="menu-sub-title"> Images </div>
       <div class='menu-option'><span>Width</span> <input type="number" prefKey="imageSize" :value="imageSize" @change="saveAndFire('update-image-size', $event)" @keyup="saveAndFire('update-image-size', $event)" /></div>
       <div class="menu-sub-title"> Logging </div>
       <div class='menu-option'>
         <button class='menu-button' v-on:click="confirmDeleteLogs" :disabled="!(logFiles.length > 0)"><i class="far fa-trash-alt"></i> <span>Delete logs ({{ logFiles.length }} files)</span> </button>
       </div>
  </ejs-sidebar>
</template>

<script>
  export default {
      created () {
        this.confirmSubmit = this.appCfg.preferences.isEnabled("confirmSubmit", true);
        this.videoAutoplay = this.appCfg.preferences.isEnabled("videoAutoplay", true);
        this.imageSize = this.appCfg.preferences.load(this.appCfg.preferences.prefKeys.IMAGE.SIZE, 100);
        this.videoWidth = this.appCfg.preferences.load(this.appCfg.preferences.prefKeys.VIDEO.WIDTH, 300);
        this.checkForLogs();
      },
      data () {
          return {
           type :'Push',
           target : '.content',
           position : 'Right',
           enableGestures : false,
           enablePersistence: false,
           logFiles: []
          }
      },
      methods: {
          // positionChange: function(args) {
          //   this.position = args.event.target.id == "left" ? "Left" : "Right";
          // },

          saveAndFire: function(text, $event) {
            this.togglePreference($event);
            this.$parent.$emit(text, parseInt($event.srcElement.value));
          },

          togglePreference: function(event) {
            // window.log(event);
            let el = event.srcElement;
            let prefKey = el.getAttribute("prefKey");
            if(el.type == "checkbox")
              this.appCfg.preferences.save(prefKey, el.checked);
            else if (el.type == "number")
              this.appCfg.preferences.save(prefKey, el.value);
          },

          openMenu: function() {
            this.$refs.sidebar.show();
          },

          closeMenu: function() {
            this.$refs.sidebar.hide();
          },


          closeClick: function() {
           this.$refs.sidebar.hide();
           // this.$refs.togglebtn.$el.classList.remove('e-active');
           // this.$refs.togglebtn.Content = 'Open';
         },

         checkForLogs: function() {
           let logServerUrl = window.appCfg.dbServer.url + ':' + window.appCfg.dbServer.port;
           let url = logServerUrl + window.appCfg.dbServer.logRoute;

           fetch(url, {
               method: "GET",
               mode: "cors"
           }).then(response => {
               let json = response.json();
               // status ok
               if (response.ok) {
                 json.then(result => {
                   this.logFiles = result.files;
                   // window.log("#log files " + result.files.length);
                   return result;
                 });
               } else {
                 // error
                 return json.then(err => {throw err;});
               }
           }).catch(error => {
               // let msg = error.message ? error.message : error;
               window.log(`Error listing log dir of ${logServerUrl}.`);
               window.log(error);
           });
         },

         confirmDeleteLogs: function() {

           let logServerUrl = window.appCfg.dbServer.url + ':' + window.appCfg.dbServer.port;
           let url = logServerUrl + window.appCfg.dbServer.logRoute;

           this.confirmDialog(this, "<span>Delete all logs on "+logServerUrl+"?</span>",
             // confirmed
             () => {
               fetch(url, {
                   method: "DELETE",
                   mode: "cors"
               }).then(response => {
                   let txt = response.text();
                   // status ok
                   if (response.ok) {
                     txt.then(result => {
                       window.log("Cleared log!");
                       this.checkForLogs();
                       return result;
                     });
                   } else {
                     // error
                     return txt.then(err => {throw err;});
                   }
               }).catch(error => {
                   // let msg = error.message ? error.message : error;
                   window.log(`Error listing log dir of ${logServerUrl}.`);
                   window.log(error);
               });
             },
             // cancelled
             () => {}
           );
         }
     }, // methods
     mounted() {

     }
  } // export
</script>
