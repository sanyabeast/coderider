<template>
   <v-card
      class="settings-menu"
      >
      <v-list>
         <v-list-tile avatar>
            <v-list-tile-content>
               <v-list-tile-title>ДЕМО 101</v-list-tile-title>
               <v-list-tile-sub-title>Настройки</v-list-tile-sub-title>
            </v-list-tile-content>
         </v-list-tile>
      </v-list>
      <v-divider></v-divider>
      <v-layout column grow class="window-content">
            <v-tabs
               v-model="tab"
               dark
               color="deep-orange"
            >
               <v-tabs-slider color="yellow"></v-tabs-slider>
               <v-tab key="0">
                  Освещение
               </v-tab>
               <v-tab key="1">
                  Симуляция
               </v-tab>
               <v-tab key="2">
                  Дополнительно
               </v-tab>
            </v-tabs>

            <v-tabs-items 
                v-model="tab" 
                class="tab-items" 
                touchless
                ref="tabsItems"
            >
               <v-tab-item key="0">
                  <v-card flat>
                     <LightSettings
                     />
                  </v-card>
               </v-tab-item>
               <v-tab-item key="1">
                  <v-card flat>
                     <SimSettings
                     />
                  </v-card>
               </v-tab-item>
               <v-tab-item key="2">
                    <v-card flat>
                        <ExtraSettings
                        />
                    </v-card>
               </v-tab-item>
            </v-tabs-items>

      </v-layout>
      <v-card-actions class="settings-actions">
         <v-spacer></v-spacer>
         <v-btn flat @click="onExit">Выход</v-btn>
      </v-card-actions>
   </v-card>
   <!-- <div
      class="pause-menu"
      @click="onClick"
      >
        <p>Resume</p>
        <a :href="apk_dl_url">Download APK</a>
        
      </div> -->
</template>
<script>

import data from "data/data.json"
import LightSettings from "components/Settings/LightSettings.vue"
import SimSettings from "components/Settings/SimSettings.vue"
import ExtraSettings from "components/Settings/ExtraSettings.vue"

export default {
    components : { LightSettings, SimSettings, ExtraSettings },
    data () {
        return {
            apk_dl_url: data.apk_dl_url,
            tab: null
        }
    },
    watch: {
        tab () {
            if ( this.$refs.tabsItems ) {
                this.$refs.tabsItems.$el.scrollTop = 0
            }
        }
    },
    methods: {
        onExit () {
            this.$emit( "exit" )
        },
        reset () {
            this.tab = 0
        }
    }
}
   
</script>

<style lang="sass">

</style>