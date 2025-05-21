<template>
    <div class="button" :data-mode="mode" @click="onClick">
        <img class="icon" src="buttonIconSrc" />
        <p class="button-caption" v-html="buttonCaptionContent"></p>
    </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue'

const props = Vue.defineProps({
    buttonCaptionContent: {
        type: String,
        default: ""
    },
    buttonIconSrc: {
        type: String,
        default: ""
    },
    mode: {
        type: String,
        default: "all"
    }
})

const emit = Vue.defineEmits(['click'])

function onClick(evt: Event) {
    evt.stopPropagation()
    emit("click", {})
}
</script>

<style lang="sass">

</style>