<template>
    <div class="app root dark-theme" :class="{ overlayActive: store.paused }" :data-browser-name="store.browserName"
        :data-mobile-device="store.mobileDevice ? 1 : 0" tabindex="-1">
        <Game @pauseClick="onPauseClick" ref="gameComponent"></Game>
        <div class="overlay" v-if="store.paused"></div>

        <div class="pause-button topbar-button" @click="onPauseClick" v-if="!store.paused" v-show="!store.paused"
            title="Press 'Space' key">
            <div>
                <i class="material-icons">pause</i>
            </div>
        </div>

        <div class="revoke-button topbar-button" @click="simulateKeyPress('q')" v-if="!store.paused" title="Press 'Q' key">
            <div><i class="material-icons">replay</i></div>
        </div>

        <div class="respawn-button topbar-button" @click="simulateKeyPress('r')" v-if="!store.paused" title="Press 'R' key">
            <div><i class="material-icons">undo</i></div>
        </div>

        <!-- Compact pause menu positioned in the corner -->
        <div class="pause-menu-wrapper" v-if="store.paused">
            <Pause @resume="onResumeClick" />
        </div>
    </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue'
import Button from "./Button.vue"
import Pause from "./Pause.vue"
import Game from "./Game.vue"
import { useGameStore } from '../App'

const store = useGameStore()
const gameComponent = Vue.ref<InstanceType<typeof Game> | null>(null)

Vue.onMounted(() => {
    document.body.addEventListener("touchmove", (evt) => {
        evt.stopPropagation()
        evt.preventDefault()
    })
})

function simulateKeyPress(key) {
    // Create a keyboard event with the key code
    let keyCode;
    switch(key.toLowerCase()) {
        case 'q': keyCode = 81; break;
        case 'r': keyCode = 82; break;
        default: return;
    }
    
    // Create the keyboard event
    const event = document.createEvent('KeyboardEvent');
    
    // Use the deprecated initKeyboardEvent for maximum browser compatibility
    if (typeof event.initKeyboardEvent !== 'undefined') {
        event.initKeyboardEvent(
            'keydown', // event type
            true,      // bubbles
            true,      // cancelable
            window,    // view
            false,     // ctrlKey
            false,     // altKey
            false,     // shiftKey
            false,     // metaKey
            keyCode,   // keyCode
            0          // charCode
        );
    } else {
        // Fallback for browsers that don't support initKeyboardEvent
        Object.defineProperty(event, 'keyCode', { get: function() { return keyCode; } });
        Object.defineProperty(event, 'which', { get: function() { return keyCode; } });
    }
    
    // Dispatch the event on the document
    document.dispatchEvent(event);
}

function onPauseClick() {
    store.paused = true
}

function onResumeClick() {
    store.paused = false
}
</script>

<style lang="scss">
    @import "../../res/sass/app.scss";
    @import "../../res/sass/fonts.scss";
    @import "../../res/sass/material-overrides.scss";
    @import "../../res/sass/vue-theme.scss";
</style>