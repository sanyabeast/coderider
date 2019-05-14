<template>
    <v-card
        class="pause-menu"
    >
      <v-list>
        <v-list-tile avatar>
          <v-list-tile-content>
            <v-list-tile-title>ДЕМО 101</v-list-tile-title>
            <v-list-tile-sub-title>Меню паузы</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>

      <v-divider></v-divider>



      <v-list>
        
        <v-list-tile>
            <v-btn
                v-if="!$store.state.isHybridApp"
                href="app.apk"
                outline color="indigo"
            >
                Скачать APK
            </v-btn>
        </v-list-tile>
        <v-list-tile avatar>
          <v-btn
                outline color="red"
                @click="reload()"
            >
                Перезапустить
            </v-btn>
        </v-list-tile>

        <v-list-tile>
            <v-btn
                @click="$store.dispatch(`loadDefaults`)"
                outline color="normal"
            >
                Сбросить настройки
            </v-btn>
        </v-list-tile>

      </v-list>



      <v-card-actions>
        <v-spacer></v-spacer>

        
        <v-btn flat color="primary" @click="onResumeClick">Продолжить</v-btn>
        
        <v-btn  flat color="secondary" @click="onSettingsClick">Настройки</v-btn>
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