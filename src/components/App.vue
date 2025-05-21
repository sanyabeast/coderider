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

        <div class="revoke-button topbar-button" @click="simulateKeyPress('q')" v-if="!store.paused"
            title="Press 'Q' key">
            <div><i class="material-icons">replay</i></div>
        </div>

        <div class="respawn-button topbar-button" @click="simulateKeyPress('r')" v-if="!store.paused"
            title="Press 'R' key">
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
    switch (key.toLowerCase()) {
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
        Object.defineProperty(event, 'keyCode', { get: function () { return keyCode; } });
        Object.defineProperty(event, 'which', { get: function () { return keyCode; } });
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
html,
body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    -ms-touch-action: manipulation;
    touch-action: manipulation;
    background-color: #000000;
    user-select: none;
}

body {
    position: fixed;
    left: 0;
    top: 0;
    left: 0;
    top: 0;
    object-fit: cover;
    transform: translateZ(0);
}

* {
    user-select: none;
    -webkit-user-select: none;
    font-family: 'Montserrat';
}

.app {
    width: 100%;
    height: 100%;
    position: relative;

    .application--wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: auto;
    }

    .topbar-button {
        color: #ffffff;
        font-size: 24px;
        font-weight: 800;
        padding: 8px;
        text-align: center;
        position: absolute;
        top: 8px;
        z-index: 2;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            div {
                background-color: #00000033;
            }
        }

        i {
            font-size: 44px;
            color: #fff;
            width: 58px;
        }

        div {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 2px solid white;
            background: #0000001f;
        }

        &.mute-button {
            left: 56px;
        }

        &.pause-button {
            right: 56px;
        }

        &.revoke-button {
            right: 128px;
        }


    }

    .pause-menu {
        width: calc(100% - 24px);
        height: calc(100% - 24px);
        z-index: 3;
        display: flex;
        flex-direction: column;

        hr+.v-list {
            flex-grow: 1;
        }
    }

    .overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }
}

/* fallback */
@font-face {
    font-family: 'Material Icons';
    font-style: normal;
    font-weight: 400;
    src: url('/res/fonts/material_icons.woff2') format('woff2');
}

.material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
}

/* Vue 3 theme styles to replace Vuetify */

.dark-theme {
    background-color: #121212;
    color: #ffffff;
}

.app.root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    font-family: 'Roboto', sans-serif;
    display: flex;
    flex-direction: column;

    /* Only blur game content, not the pause menu */
    &.overlayActive .game.root {
        filter: blur(2px);
    }
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 100;
    pointer-events: auto;
}

.pause-menu-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    /* Higher than overlay */
    pointer-events: auto;
}

.topbar-button {
    position: fixed !important;
    z-index: 10;
    width: 48px !important;
    height: 48px !important;
    border-radius: 8px !important;
    background: linear-gradient(to bottom, rgba(40, 40, 60, 0.7), rgba(30, 30, 45, 0.8)) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;

    i.material-icons {
        font-size: 24px !important;
        color: rgba(255, 255, 255, 0.9) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
    }

    &:hover {
        background: linear-gradient(to bottom, rgba(50, 50, 70, 0.8), rgba(40, 40, 55, 0.9)) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
    }

    &:active {
        background: linear-gradient(to bottom, rgba(255, 132, 0, 0.8), rgba(200, 100, 0, 0.7)) !important;
        transform: translateY(1px) !important;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;

        i.material-icons {
            color: white !important;
        }
    }

    div {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }
}

/* Top bar buttons positioning */
.pause-button {
    top: 15px !important;
    right: 15px !important;
}

.revoke-button {
    top: 15px !important;
    right: 85px !important;
}

.respawn-button {
    top: 15px !important;
    right: 155px !important;
}

/* Game controls styling */
.car-control {
    position: fixed !important;
    bottom: 20px !important;
    width: 120px !important;
    height: 80px !important;
    border-radius: 8px !important;
    background: linear-gradient(to bottom, rgba(40, 40, 60, 0.7), rgba(30, 30, 45, 0.8)) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    user-select: none !important;
    z-index: 50 !important;

    p {
        color: rgba(255, 255, 255, 0.7) !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        margin: 0 !important;
    }

    &:hover {
        background: linear-gradient(to bottom, rgba(50, 50, 70, 0.8), rgba(40, 40, 55, 0.9)) !important;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
    }

    &:active,
    &.active {
        background: linear-gradient(to bottom, rgba(255, 132, 0, 0.8), rgba(200, 100, 0, 0.7)) !important;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        transform: translateY(2px) !important;

        p {
            color: white !important;
        }
    }
}

.engine {
    left: 20px !important;
    right: auto !important;
}

.brake {
    right: 20px !important;
    left: auto !important;
}
</style>