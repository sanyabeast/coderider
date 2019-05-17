<template>
    <div class="tokens">
        <i 
            v-if="this.$store.state.saveChunks"
            class="material-icons"
            title="Хранить чанки в памяти"
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