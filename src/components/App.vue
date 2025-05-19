<template>
    <v-app dark class="app root" v-bind:class="{ overlayActive: pauseMenuShown }"
        :data-browser-name="$store.state.browserName" :data-mobile-device="$store.state.mobileDevice ? 1 : 0"
        tabindex="-1">
        <Game @pauseClick="onPauseClick" ref="game"></Game>



        <div class="overlay" v-if="pauseMenuShown"></div>

        <div class="pause-button topbar-button" @click="onPauseClick" v-if="!$store.state.pauseMenuShown"
            v-show="!pauseMenuShown" title="Press 'Space' key">
            <div>
                <i class="material-icons">pause</i>
            </div>
        </div>

        <div class="revoke-button topbar-button" @click="$refs.game.revoke()" v-show="!pauseMenuShown"
            title="Press 'Q' key">
            <div><i class="material-icons">replay</i></div>
        </div>

        <div class="respawn-button topbar-button" @click="$refs.game.respawn()" v-show="!pauseMenuShown"
            title="Press 'R' key">
            <div><i class="material-icons">undo</i></div>
        </div>
        
        <Pause v-show="pauseMenuShown" @resume="onResumeClick" />
    </v-app>
</template>

<script lang="ts">

import Button from "components/Button.vue"
import Pause from "components/Pause.vue"

import Game from "components/Game.vue"
import { mapState } from 'vuex'


export default {
    components: { Button, Game, Pause },
    data() {
        return {

        }
    },
    computed: mapState([
        "pauseMenuShown",
        "paused"
    ]),
    watch: {
        paused(key) {
            if (key) {
                this.$store.state.pauseMenuShown = true
            } else {
                this.$store.state.pauseMenuShown = false
            }
        }
    },
    mounted() {
        document.body.addEventListener("touchmove", (evt) => {
            evt.stopPropagation()
            evt.preventDefault()
        })
    },
    methods: {
        onPauseClick() {
            this.$store.state.paused = true
        },
        onResumeClick() {
            this.$store.state.paused = false
        },
        onAppClick() {

        },
    }

}

</script>

<style lang="sass">
    import "sass/app.scss"
    import "sass/fonts.scss"
    import "sass/material-overrides.scss"
</style>