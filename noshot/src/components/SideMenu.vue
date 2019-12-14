<template>
  <ejs-sidebar id="default-sidebar" ref="sidebar" :type="type" :target="target" :enableGestures="enableGestures" :position="position" :enablePersistence="enablePersistence">
      <div class="menu-title"> Options </div>
       <div class="menu-sub-title"> Submission </div>
       <div class='menu-option'><input type="checkbox" v-bind:checked="confirmSubmit" v-on:click="togglePreference" value="confirmSubmit"> <span>confirm submissions</span></div>
       <div class="menu-sub-title"> Logging </div>
  </ejs-sidebar>
</template>

<script>
  export default {
      created () {
        this.confirmSubmit = this.appCfg.preferences.isEnabled("confirmSubmit", true);
      },
      data () {
          return {
           type :'Push',
           target : '.content',
           position : 'Right',
           enableGestures : false,
           enablePersistence: false
          }
      },
      methods: {
          // positionChange: function(args) {
          //   this.position = args.event.target.id == "left" ? "Left" : "Right";
          // },

          togglePreference: function(event) {
            window.log(event);
            let el = event.srcElement;
            let prefKey = el.value;
            this.appCfg.preferences.save(prefKey, el.checked);
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
          }
      }
  }
</script>
