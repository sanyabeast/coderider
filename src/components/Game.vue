<template>
    <div ref="root" class="game root" tabindex="-1" @keydown="handleKeyDown" @keyup="handleKeyUp">

        <canvas ref="canvas"></canvas>

        <div class="car-control engine" v-bind:class="{ active: engineActive }" @mousedown="engineActive = true"
            @mouseup="engineActive = false" @touchstart="engineActive = true" @touchend="engineActive = false"
            v-show="!(store.paused)" title="'Up' key or 'D' key">
            <p>Engine</p>
        </div>
        <div class="car-control brake" v-bind:class="{ active: breakActive }" @mousedown="breakActive = true"
            @mouseup="breakActive = false" @touchstart="breakActive = true" @touchend="breakActive = false"
            v-show="!(store.paused)" title="'Down' key or 'A' key">
            <p>Brake</p>
        </div>

    </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue'
import { Game } from "../game/game"
import { useGameStore } from '../App'

const store = useGameStore()
const root = Vue.ref<HTMLElement | null>(null)
const canvas = Vue.ref<HTMLCanvasElement | null>(null)
const engineActive = Vue.ref(false)
const breakActive = Vue.ref(false)

let game: Game

Vue.watch(() => store.paused, (value) => {
    game.setPaused(value)
})

Vue.watch(engineActive, (value) => {
    game.setEngineActive(value)
})

Vue.watch(breakActive, (value) => {
    game.setBreakActive(value)
})

Vue.onMounted(() => {
    game = new Game(root.value!, canvas.value!)
})

function togglePause() {
    store.paused = !store.paused
}

function revoke() {
    game.revoke()
}

function respawn() {
    game.respawn()
}

function handleKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Arrow keys and WASD for engine/brake
    if (event.keyCode === 39 || event.keyCode === 68) { // Right arrow or D
        engineActive.value = true;
    } else if (event.keyCode === 37 || event.keyCode === 65) { // Left arrow or A
        breakActive.value = true;
    }

    // Other controls
    if (event.keyCode === 32) { // Space
        togglePause();
    } else if (event.keyCode === 27) { // Escape
        store.paused = false;
    } else if (event.keyCode === 82 || event.keyCode === 87) { // R or W
        respawn();
    } else if (event.keyCode === 81 || event.keyCode === 83) { // Q or S
        revoke();
    }
}

function handleKeyUp(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Arrow keys and WASD for engine/brake
    if (event.keyCode === 39 || event.keyCode === 68) { // Right arrow or D
        engineActive.value = false;
    } else if (event.keyCode === 37 || event.keyCode === 65) { // Left arrow or A
        breakActive.value = false;
    }
}

// Explicitly expose methods and the game instance to parent components
Vue.defineExpose({
    revoke: () => {
        if (game) game.revoke();
    },
    respawn: () => {
        if (game) game.respawn();
    },
    getGameInstance: () => game
})
</script>

<style lang="scss">
.game {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    perspective: 1000px;
    -webkit-perspective: 1000px;

    .svg-layer {
        position: absolute;
        left: 0;
        top: 0;
    }

    canvas {
        width: 100% !important;
        height: 100% !important;
    }

    .matter-renderer {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;

        canvas {
            width: 100% !important;
            height: 100% !important;
            background: 0% 0% / contain #0000007d !important;
        }
    }

    .car-control {
        position: absolute;
        bottom: 36px;
        width: 128px;
        height: 80px;
        background: #0000001f;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
        border-radius: 8px;
        transition: transform 0.1s ease-out;
        transform-origin: bottom center;
        cursor: pointer;

        &:hover {
            background-color: #00000033;
        }

        &.engine {
            left: 64px;
        }

        &.break {
            right: 64px;
        }

        &.active {
            transform: translateY(16px);
        }

        p {
            margin: 0;
            color: #fff;
            font-family: 'Montserrat';
            text-transform: uppercase;
            font-weight: 800;
            font-size: 18px;
        }
    }
}
</style>