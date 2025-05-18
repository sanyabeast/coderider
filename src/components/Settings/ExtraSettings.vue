<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Performance</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.saveChunks"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.saveChunks = !$store.state.saveChunks">
	        <v-list-tile-title>Store chunks in memory</v-list-tile-title>
	        <v-list-tile-sub-title>Hide or delete</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>


	    <v-subheader>Built-in engine renderer</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.wonderMatterTestRenderer"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.wonderMatterTestRenderer = !$store.state.wonderMatterTestRenderer">
	        <v-list-tile-title>Active</v-list-tile-title>
	        <v-list-tile-sub-title>Enables and disables built-in matter.js renderer</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-card flat color="transparent">
	    	<v-subheader>Scale</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.wonderMatterTestRendererSize"
	            	thumb-label="always"
	            	min="0.1"
	            	step="0.1"
	            	max="10"
	            	:disabled="!$store.state.wonderMatterTestRenderer"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card> 
	

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