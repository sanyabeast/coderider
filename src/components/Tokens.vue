<template>
    <div class="tokens">
        <i 
            v-if="bumpmappingEnabled"
            class="material-icons"
            title="Бампмаппинг активен"
        >blur_linear</i>
        <i 
            v-if="this.$store.state.saveChunks"
            class="material-icons"
            title="Чанки не удаляются"
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