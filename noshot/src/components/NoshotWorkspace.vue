<template>
<div>
    <SideMenu ref="sideMenu" />
    <ejs-button id="toggleMenuButton" ref="togglebtn" class="e-btn e-info"  cssClass="e-flat" iconCss="e-icons burg-icon" isToggle="true" v-on:click.native="toggleSideMenu"></ejs-button>
    <NoshotVideo v-for="vid of videos" :key="vid.id + '_' + vid.frame.second" :video="vid"/>
    <div class="header">
        <div class="tabs">
            <ul class="">
                <li v-for="w of workspaces" v-bind:key="w.id" :class="{ tab: true, selected: visibility == w.id }">
                    <a :href="'#/' + w.id">{{ w.id }}</a>
                    <div class="menu">
                        <button v-if="w.id != 'default'" class="destroy" @click="removeWorkspace(w)">X</button>
                    </div>
                </li>
                <li class="tab new">
                  <input href="#" :class="{green: getTabCheck, red: !getTabCheck}" placeholder="new tab" v-model="newTab" @keyup.enter="addTab" />

                  <button class="newTab" @click="addTabButton">+</button>
                </li>
            </ul>
        </div>
        </div>
    <div class="content">

        <SearchTool v-if="typeof activeWorkspace !== 'undefined'" :activeWorkspace="activeWorkspace" />

    </div>
</div>
</template>

<script>
import SearchTool from './SearchTool.vue'
import NoshotVideo from './NoshotVideo.vue'
import SideMenu from './SideMenu.vue'


// localStorage persistence
var STORAGE_KEY = 'DIVE-layout'
var searchStorage = {
    fetchWorkspaces: function() {
        var w = JSON.parse(localStorage.getItem(STORAGE_KEY + "_workspaces") || '[]');
        return w;
    },
    saveWorkspaces: function(workspaces) {
        localStorage.setItem(STORAGE_KEY + "_workspaces", JSON.stringify(workspaces))
    }
}

export default {
    name: 'Workspace',
    components: {
      SearchTool,
      NoshotVideo,
      SideMenu
    },
    created() {
      // listeners
      this.$on('open-video', (video) => {
        this.openVideo(video);
      });
      this.$on('close-video', (video) => {
        this.closeVideo(video);
      });
      document.addEventListener('keyup', (evt) => {
          if (evt.keyCode === 27) {
              this.escape();
          }
      });
    },
    props: {
    },
    data: () => {
        return {
            workspaces: searchStorage.fetchWorkspaces(),
            newTab: '',
            tabCheck: true,
            visibility: 'default',
            activeWorkspace: undefined,
            loading: false,
            post: null,
            error: null,
            videos: []
        };
    },

    // watch searches change for localStorage persistence
    watch: {
        workspaces: {
            handler: function(workspaces) {
                searchStorage.saveWorkspaces(workspaces)
            },
            deep: true
        },
        newTab: {
            handler: function() {
                this.tabCheck = true;
                for (var w of this.workspaces) {
                    if (w.id.toLowerCase() == allowedString(this.newTab).toLowerCase()) {
                        this.tabCheck = false;
                    }
                }
            },
            deep: true

        }
    },

    computed: {
        getWorkspaces: function() {
            return this.workspaces
        },
        getTabCheck: function() {
            return this.tabCheck
        }
    },

    methods: {
        addTab: function() {
            var value = allowedString(this.newTab)
            if (!value) {
                return
            }
            if (!this.tabCheck) {
                return;
            }
            this.workspaces.push({
                id: value,
                name: value
            });

            this.visibility = value;
            window.location.hash = "/" + this.visibility;
            this.newTab = '';
        },

        addTabButton: function() {
          let name = "Tab";
          let nameNumber = 1;
          let nameUsed = true;

          while (nameUsed) {
            nameUsed = false;
            for (var w of this.workspaces) {
                if (w.id.toLowerCase() == (name + nameNumber).toLowerCase()) {
                    nameUsed = true;
                    nameNumber++;
                }
            }
          }
          this.newTab = name + nameNumber;
          this.addTab();
        },


        removeWorkspace: function(workspace) {
            var temp = [];
            for (let search of this.searches) {
                temp.push(search);
            }

            for (var i = 0; i < this.searches.length; i++) {
                if (this.searches[i].workspace == workspace.id) {
                    this.searches.splice(this.searches.indexOf(this.searches[i]), 1)
                    i--;
                }
            }

            this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
            // this.visibility = 'default';
        },

        // handle routing
        onHashChange: function() {
            var hash = window.location.hash.replace(/#\/?/, '')
            // app.visibility = 'default'

            for(var w of this.workspaces)
            {
                if(w.id == hash)
                {
                    this.visibility = hash;
                    this.activeWorkspace = w;
                }
            }
        },

        toggleSideMenu: function(){
          if(this.$refs.togglebtn.$el.classList.contains('e-active')){
              this.$refs.togglebtn.Content = 'Open';
              // this.$emit('closeMenu');
              this.$refs.sideMenu.closeMenu();
          }
          else{
              this.$refs.togglebtn.Content = 'Close';
              // this.$emit('openMenu');
              this.$refs.sideMenu.openMenu();
          }
        },

        openVideo: function(video) {
          for (let v of this.videos) {
            // don't open same videos twice
            if (v.getUniqueID() === video.getUniqueID()) return;
          }
          this.videos.push(video);
        },

        closeVideo: function(video) {
          let idx = this.videos.indexOf(video);
          if (idx > -1) this.videos.splice(idx, 1);
        },

        escape: function() {
          this.closeVideo(this.videos[this.videos.length-1]);
        },

        getClosest: function(goal, allowed) {
          return allowed.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
          });
        }
    },

    mounted: function() {
        window.addEventListener('hashchange', this.onHashChange)
        this.onHashChange()
    }
}

function allowedString(input) {
    var out = input.trim();
    out = out.replace(/ +/g, "_");
    out = out.replace(/!(A-Za-z_-)/g, "");
    return out;
}
</script>
