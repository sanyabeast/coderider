<template>
    <div
      class="button"
      :data-mode="mode"
      @click="onClick"
    >
        <img 
            class="icon" 
            src="buttonIconSrc"
        />
        <p 
            class="button-caption"
            v-html="buttonCaptionContent"
        ></p>
    </div>
</template>

<script>

export default {
    props: {
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
    },
    methods: {
        onClick ( evt ) {
            evt.stopPropagation()
            
            this.$emit( "click", {
                
            } )
        }
    }
}
   
</script>

<style lang="sass">

</style>