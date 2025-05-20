<template>
    <div ref="root" class="game root" @keydown.right.stop.prevent="engineActive = true"
        @keyup.right.stop.prevent="engineActive = false" @keydown.left.stop.prevent="breakActive = true"
        @keyup.left.stop.prevent="breakActive = false" @keydown.68.stop.prevent="engineActive = true"
        @keyup.68.stop.prevent="engineActive = false" @keydown.65.stop.prevent="breakActive = true"
        @keyup.65.stop.prevent="breakActive = false"
        @keydown.space.stop.prevent="$store.state.paused = !$store.state.paused"
        @keydown.27.stop.prevent="$store.state.paused = false;" @keydown.69.stop.prevent="game.respawn()"
        @keydown.81.stop.prevent="game.revoke()" tabindex="-1">

        <canvas ref="canvas"></canvas>

        <div class="car-control engine" v-bind:class="{ active: engineActive }" @mousedown="engineActive = true"
            @mouseup="engineActive = false" @touchstart="engineActive = true" @touchend="engineActive = false"
            v-show="!(paused)" title="'Up' key or 'D' key ">
            <p>Engine</p>
        </div>
        <div class="car-control break" v-bind:class="{ active: breakActive }" @mousedown="breakActive = true"
            @mouseup="breakActive = false" @touchstart="breakActive = true" @touchend="breakActive = false"
            v-show="!(paused)" title="'Down' key or 'A' key">
            <p>Break</p>
        </div>

    </div>
</template>

<script lang="ts">

import { mapState } from 'vuex'
import { Game } from "components/Game/Game"

export default {
    components: {},
    data() {
        return {
            engineActive: false,
            breakActive: false
        }
    },
    computed: {
        ...mapState([
            "paused"
        ])
    },
    watch: {
        paused(value) {
            this.game.setPaused(value)
        },
        engineActive(value) {
            this.game.setEngineActive(value);
        },
        breakActive(value) {
            this.game.setBreakActive(value)
        }
    },
    mounted() {
        this.game = new Game(this.$refs.root, this.$refs.canvas)
    }
}

</script>

<style lang="sass">
    import "sass/game.scss"
</style>