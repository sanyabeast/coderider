<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Производительность</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.saveChunks"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.saveChunks = !$store.state.saveChunks">
	        <v-list-tile-title>Хранить чанки в памяти</v-list-tile-title>
	        <v-list-tile-sub-title>Прятать или удалять</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>


	  </v-list>
	
</template>


<script type="text/javascript">
	import { map } from "lodash"

	const config = require("data/config.json")
	
	export default {
		data () {
			return {
				backgroundShaders: map( config.backgrounds, ( el, name )=> name )
			}
		}
	}
</script>