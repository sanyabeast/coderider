<template>
    <div class="tokens">
        <i 
            v-if="bumpmappingEnabled"
            class="material-icons"
            title="Bump mapping is active"
        >blur_linear</i>
        <i 
            v-if="this.$store.state.saveChunks"
            class="material-icons"
            title="Chunks are not deleted"
        >save</i>

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