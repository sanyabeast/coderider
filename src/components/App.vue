<template>
    <v-app
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

        />

        <div class="overlay"
            v-if="pauseMenuShown || settingsMenuShown"
        ></div>

        <p 
            class="pause-button"
            @click="onPauseClick"
            v-if="!$store.state.pauseMenuShown && !$store.state.settingsMenuShown"
        >
            <i class="material-icons">pause</i>
        </p>
        <p 
            class="mute-button"
            @click="$store.state.soundMuted = !$store.state.soundMuted; $store.dispatch( `checkFullscreen` )"
        >
            <i 
                class="material-icons"
            >{{ $store.state.soundMuted ? `volume_muted` : `volume_up` }}</i>
        </p>

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
        "settingsMenuShown"
    ] ),
	mounted () {
        this.$store.dispatch( "load" )
        // document.body.addEventListener( "touchstart", ( evt )=>{
        //     evt.stopPropagation()
        //     evt.preventDefault()
        // } )

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

       

	},
    methods: {
        onPauseClick () {
            console.log(1)
            this.$refs.wonderland.stopRendering()
            this.$store.state.pauseMenuShown = true
        },
        onResumeClick () {
            this.$store.state.pauseMenuShown = false
            this.$refs.wonderland.startRendering()
        },  
        onShowSettings () {
            this.$store.state.pauseMenuShown = false;
            this.$store.state.settingsMenuShown = true;
        },
        onSettingsExit () {
            this.$store.dispatch( "save" )
            this.$store.state.settingsMenuShown = false
            this.$store.state.pauseMenuShown = false
            this.$refs.wonderland.startRendering()
        },
        onSettingsEnter ( el, done ) {
            this.$refs.settingsMenu.reset()
            done()
        },
        onSettingsLeave ( el, done ) {
            done()
        },
        onAppClick () {            
        }
    }

}
   
</script>

<style lang="sass">
    import "sass/app.scss"
    import "sass/fonts.scss"
</style>