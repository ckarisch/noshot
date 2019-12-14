<template>
  <ejs-sidebar id="default-sidebar" ref="sidebar" :type="type" :target="target" :enableGestures="enableGestures" :position="position" :enablePersistence="enablePersistence">
      <div class="title"> Options </div>
       <div class="sub-title"> Submission </div>
       <div class='menu-option'><input type="checkbox" value="confirmSubmit"> <span>confirm submissions</span></div>
       <div class="sub-title"> Logging </div>
  </ejs-sidebar>
</template>

<script>
  export default {
      created () {
        // window.log(this)
        // this.$root.on('openMenu', () => {
        //   this.$refs.sidebar.show();
        // });
        // this.$root.on('closeMenu', () => {
        //   this.$refs.sidebar.hide();
        // });
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
