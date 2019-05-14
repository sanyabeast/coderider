<template>
    <div class="tokens">
        <i 
            v-if="bumpmappingEnabled"
            class="material-icons"
        >blur_linear</i>

        <i 
            class="material-icons"
            :style="`color: ${ $store.state.lightAColor }`"
        >wb_sunny</i>

        <i 
            class="material-icons"
            :style="`color: ${ $store.state.lightBColor }`"
        >wb_sunny</i>

        <div class="separator"></div>

        <i 
            v-if="physicEnabled"
            class="material-icons"
        >check</i>

        <i 
            v-if="gyroGravityEnabled"
            class="material-icons"
        >crop_rotate</i>
    </div>
</template>

<script>

import { mapState } from 'vuex';

export default {
    computed: mapState( [
        "gyroGravityEnabled",
        "bumpmappingEnabled",
        "physicEnabled"
    ] )
}
   
</script>

<style lang="sass">

</style>