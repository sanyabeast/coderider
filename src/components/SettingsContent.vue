<template>
    <v-card
        class="pause-menu"
    >
      <v-list>
        <v-list-tile avatar>
          <v-list-tile-content>
            <v-list-tile-title>DEMO 101</v-list-tile-title>
            <v-list-tile-sub-title>Settings Menu</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>

      <v-divider></v-divider>

      <v-layout align-center>
      
  
      <v-flex text-xs-center>
        <div>
          <v-btn flat large>Lighting</v-btn>
        </div>
        <div>
          <v-btn flat large color="primary">Simulation</v-btn>
        </div>
      </v-flex>
    </v-layout>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn flat @click="onExit">Exit</v-btn>
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

export default {
    data () {
        return {
            apk_dl_url: data.apk_dl_url
        }
    },
    methods: {
        onExit () {
            this.$emit( "exit" )
        }
    }
}
   
</script>

<style lang="sass">

</style>