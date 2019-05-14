<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Шейдер фона</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.backgroundEnabled"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.backgroundEnabled = !$store.state.backgroundEnabled">
	        <v-list-tile-title>Активно</v-list-tile-title>
	        <v-list-tile-sub-title>Включить отключить фон</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-select
		        v-model="$store.state.backgroundShader"
	            :items="backgroundShaders"
	            label="Standard"
	        ></v-select>
	      </v-list-tile-action>
	    </v-list-tile>

	  </v-list>
	
</template>


<script type="text/javascript">
	import { map } from "lodash"

	const config = require("data/wonderland.config.json")
	
	export default {
		data () {
			return {
				backgroundShaders: map( config.backgrounds, ( el, name )=> name )
			}
		}
	}
</script>