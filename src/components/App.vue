<template>
    <v-app
        dark
        class="euphoria root"
        v-bind:class="{ overlayActive: (pauseMenuShown || settingsMenuShown) }"
        :data-browser-name="$store.state.browserName"
        :data-mobile-device="$store.state.mobileDevice ? 1 : 0"
    >
        <Wonderland
            @pauseClick="onPauseClick"
            ref="wonderland"
        ></Wonderland>

        <Tokens
            v-show="!(pauseMenuShown || settingsMenuShown)"
        />

        <div class="overlay"
            v-if="pauseMenuShown || settingsMenuShown"
        ></div>

        <div 
            class="pause-button topbar-button"
            @click="onPauseClick"
            v-if="!$store.state.pauseMenuShown && !$store.state.settingsMenuShown"
            v-show="!(pauseMenuShown || settingsMenuShown)"
        >
            <div>
                <i class="material-icons">pause</i>
            </div>
        </div>

        <div 
            class="revoke-button topbar-button"
            @click="$refs.wonderland.revoke()"
            v-show="!(pauseMenuShown || settingsMenuShown)"
        >
            <div><i class="material-icons">replay</i></div>
        </div>

        <div 
            class="respawn-button topbar-button"
            @click="$refs.wonderland.respawn()"
            v-show="!(pauseMenuShown || settingsMenuShown)"
        >
            <div><i class="material-icons">undo</i></div>
        </div>

        

        <div 
            class="mute-button topbar-button"
            @click="$store.state.soundMuted = !$store.state.soundMuted; $store.dispatch( `checkFullscreen` )"
            v-show="!(pauseMenuShown || settingsMenuShown)"
        >
            <div><i 
                class="material-icons"
            >{{ $store.state.soundMuted ? `volume_muted` : `volume_up` }}</i></div>
        </div>

        <Pause
            v-show="pauseMenuShown"
            @showSettings="onShowSettings"
            @resume="onResumeClick"
        />
        
        <transition 
            :css="false"
            @enter="onSettingsEnter"
            @leave="onSettingsLeave"
        >
            <Settings 
                v-show="settingsMenuShown"
                ref="settingsMenu"
                @exit="onSettingsExit"
            />
        </transition>
    </v-app>
</template>

<script>

import Button from "components/Button.vue"
import Pause from "components/Pause.vue"
import Settings from "components/Settings.vue"
import Wonderland from "components/Wonderland.vue"
import Tokens from "components/Tokens.vue"
import { mapState } from 'vuex';

export default {
	components: { Button, Wonderland, Tokens, Pause, Settings },
    data () {
        return {

        }
    },
    computed: mapState( [
        "pauseMenuShown",
        "settingsMenuShown",
        "paused"
    ] ),
    watch: {
        paused ( key ) {
            if ( key ) {
                this.$store.state.pauseMenuShown = true
            } else {
                this.$store.state.settingsMenuShown = false 
                this.$store.state.pauseMenuShown = false
            }
        }
    },
	mounted () {
        this.$store.dispatch( "load" )

        if ( !this.$store.state.isHybridApp && this.$store.state.mobileDevice && this.$store.state.browserName != "safari" ) {
            document.body.addEventListener( "click", ()=>{
                this.$store.dispatch( "checkFullscreen" )
            } )
        }

        document.body.addEventListener( "touchmove", ( evt )=>{
            evt.stopPropagation()
            evt.preventDefault()
        } )


		window.addEventListener( "android.key.back.pressed", ()=>{
            this.$store.dispatch( "native", {
                method: "showExitDialog",
                args: [
                    "Really?",
                    "Yes",
                    "No"
                ]
            } )
        } )

        this.$store.dispatch( "native", {
            method: "setScreenOrientation",
            args: [
                "landscape"
            ]
        } )

	},
    methods: {
        onPauseClick () {
            this.$store.state.paused = true
        },
        onResumeClick () {
            this.$store.state.paused = false
        },  
        onShowSettings () {
            this.$store.state.pauseMenuShown = false;
            this.$store.state.settingsMenuShown = true;
        },
        onSettingsExit () {
            this.$store.dispatch( "save" )
            this.$store.state.paused = false
        },
        onSettingsEnter ( el, done ) {
            this.$refs.settingsMenu.reset()
            done()
        },
        onSettingsLeave ( el, done ) {
            done()
        },
        onAppClick () {  
                  
        },
    }

}
   
</script>

<style lang="sass">
    import "sass/app.scss"
    import "sass/fonts.scss"
    import "sass/material-overrides.scss"
</style>