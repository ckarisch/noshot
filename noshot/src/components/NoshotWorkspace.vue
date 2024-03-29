<template>
<div>
    <NoshotLogging ref="logging"></NoshotLogging>
    <SideMenu ref="sideMenu" />
    <ejs-button id="toggleMenuButton" ref="togglebtn" class="e-btn e-info"  cssClass="e-flat" iconCss="e-icons burg-icon" isToggle="true" v-on:click.native="toggleSideMenu"></ejs-button>
    <NoshotVideo v-for="vid of videos" :key="vid.id + '_' + vid.frame.second" :ref="vid.id + '_' + vid.frame.second" :video="vid" :class="{flashvideoborder: false}"/>
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

        <SearchTool :searchToolSettings="searchToolSettings" ref="searchTool" v-if="typeof activeWorkspace !== 'undefined'" :activeWorkspace="activeWorkspace" />

    </div>
</div>
</template>

<script>
import SearchTool from './SearchTool.vue'
import NoshotVideo from './NoshotVideo.vue'
import SideMenu from './SideMenu.vue'
import NoshotLogging from './NoshotLogging.vue'


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
      SideMenu,
      NoshotLogging
    },
    created() {
      // listeners
      this.$on('open-video', (video) => {
        this.openVideo(video);
      });
      this.$on('close-video', (video) => {
        this.closeVideo(video);
      });
      this.$on('update-image-size', (imageSize) => {
        this.searchToolSettings = {imageSize};
      });
      document.addEventListener('keyup', (evt) => {
          if (evt.keyCode === 27) {
              this.escape();
          }
      });
      this.$on('log-created', () => {
        this.$refs.sideMenu.checkForLogs();
      });
      this.$on('log-event', (data) => {
        this.$refs.logging.logEvent(data);
      });
      this.$on('log-result', (data) => {
        this.$refs.logging.logResult(data);
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
            videos: [],
            searchToolSettings: { imageSize: 100 }
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
            let ws = {
                id: value,
                name: value
            };
            this.workspaces.push(ws);

            // log interaction
            this.logInteract("addTab", ws);

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

        logInteract: function(method, tab) {
          let cat = window.logging.logTypes.category.BROWSE;
          let data  = {
             category: cat.key,
             type: cat.types.TOOL_LAYOUT,
             value: {
               method: method,
               id: tab.id,
               name: tab.name
             }
          }
          this.$refs.logging.logEvent(data);
        },


        removeWorkspace: function(workspace) {
            var temp = [];
            let searches = this.$refs.searchTool.searches;

            for (let search of searches) {
                temp.push(search);
            }

            for (var i = 0; i < searches.length; i++) {
                if (searches[i].workspace == workspace.id) {
                    searches.splice(searches.indexOf(searches[i]), 1)
                    i--;
                }
            }

            // log interaction
            this.logInteract("removeWorkspace", workspace);

            // window.log(searches);

            this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
        },

        // handle routing
        onHashChange: function() {
            var hash = window.location.hash.replace(/#\/?/, '')

            for(var w of this.workspaces)
            {
                if(w.id == hash)
                {
                    this.visibility = hash;
                    // triggers loading tab defined by hash/w.id
                    this.activeWorkspace = w;
                    // log interaction
                    this.logInteract("onHashChange", this.activeWorkspace);
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
            // don't open same videos twice (but jump to frame)
            if (v.getUniqueID() === video.getUniqueID()) {
              let vid_ref = this.$refs[video.id + '_' + video.frame.second][0];
              // vid_ref.$el.classList.remove('flashvideoborder');
              // vid_ref.$el.classList.add('flashvideoborder');
              vid_ref.reset(); // reset video
              return;
            }
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
        this.searchToolSettings = {
          imageSize: this.appCfg.preferences.load(this.appCfg.preferences.prefKeys.IMAGE.SIZE, 100)
        }
    }
}

function allowedString(input) {
    var out = input.trim();
    out = out.replace(/ +/g, "_");
    out = out.replace(/!(A-Za-z_-)/g, "");
    return out;
}
</script>
