<template>
    <v-card
        class="pause-menu"
    >
      <v-list>
        <v-list-tile avatar>
          <v-list-tile-content>
            <v-list-tile-title>DEMO 102</v-list-tile-title>
            <v-list-tile-sub-title>{{`Performance Index: ${ $store.state.performanceIndex }` }}</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>

      <v-divider></v-divider>



      <v-list>
        
        <v-list-tile>
            <v-btn
                dark
                v-if="!$store.state.isHybridApp"
                href="app.apk"
                color="secondary"
                outline
                flat
            >
                Download APK
            </v-btn>
        </v-list-tile>
        

        <v-list-tile>
            <v-btn
                dark
                outline
                flat
                @click="$store.dispatch(`loadDefaults`)"
                color="secondary"
            >
                Reset Settings
            </v-btn>
        </v-list-tile>

        <v-list-tile avatar>
          <v-btn
                flat color="#000000"
                @click="reload()"
            >
                Restart
            </v-btn>
        </v-list-tile>


      </v-list>



      <v-card-actions>
        <v-spacer></v-spacer>

        
        <v-btn dark depressed color="primary" @click="onResumeClick">Continue</v-btn>
        
        <v-btn dark flat outline color="secondary" @click="onSettingsClick">Settings</v-btn>
      </v-card-actions>
    </v-card>
    <!-- <div
      class="pause-menu"
      @click="onResumeClick"
    >
        <p>Resume</p>
        <a :href="apk_dl_url">Download APK</a>
        
    </div> -->

</template>

<script>

import data from "data/data.json"

console.log(data)

export default {
    data () {
        return {
            apk_dl_url: data.apk_dl_url
        }
    },
    methods: {
        onResumeClick ( evt ) {
            this.$emit( "resume" )
        },
        onSettingsClick ( evt ) {
            this.$emit( "showSettings" )
        },
        reload () {
            window.location.reload()
        }
    }
}
   
</script>

<style lang="sass">

</style>