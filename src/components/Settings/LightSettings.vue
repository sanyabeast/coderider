<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Lighting Effects Settings</v-subheader>

	    <v-subheader>Bump Mapping Settings</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.bumpmappingEnabled"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.bumpmappingEnabled = !$store.state.bumpmappingEnabled">
	        <v-list-tile-title>Bump Mapping</v-list-tile-title>
	        <v-list-tile-sub-title>Enable or disable bump mapping</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-card flat color="transparent">
	    	<v-subheader>Bump Mapping Level</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.bumpmapMultiplier"
	            	thumb-label="always"
	            	min="0"
	            	step="0.1"
	            	max="10"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<!-- <v-subheader>Light Sources</v-subheader>

    	<v-list-tile>
    		<v-list-tile-action>
		        <swatches
			      	v-model="$store.state.lightAColor"
			      	:colors="$store.state.lightColors"
			      	row-length="5"
			      	shapes="circles"
			      	show-border
			      	popover-to="left"
			    ></swatches>
		    </v-list-tile-action>

		    <v-list-tile-content>
		      	<v-list-tile-title>Light Source Color #1</v-list-tile-title>
		      	<v-list-tile-sub-title>Light Source Color #1</v-list-tile-sub-title>
		    </v-list-tile-content>

	      	
	    </v-list-tile>

	    <v-list-tile>
    		<v-list-tile-action>
		        <swatches
			      	v-model="$store.state.lightBColor"
			      	:colors="$store.state.lightColors"
			      	row-length="5"
			      	shapes="circles"
			      	show-border
			      	popover-to="left"
			    ></swatches>
		    </v-list-tile-action>

		    <v-list-tile-content>
		      	<v-list-tile-title>Light Source Color #2</v-list-tile-title>
		      	<v-list-tile-sub-title>Light Source Color #2</v-list-tile-sub-title>
		    </v-list-tile-content>

	      	
	    </v-list-tile>

	    <v-card flat color="transparent">
	    	<v-subheader>Light Sources Height</v-subheader>
  
		    <v-card-text class="pt-0">
		      <v-slider
	          	v-model="$store.state.lightsDistance"
	          	thumb-label="always"
	          	min="1"
	          	max="2000"
		      ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-card flat color="transparent">
	    	<v-subheader>Light Sources Intensity</v-subheader>
  
		    <v-card-text class="pt-0">
		      <v-slider
	          	v-model="$store.state.lightsIntensity"
	          	thumb-label="always"
	          	min="0"
	          	step="0.1"
	          	max="3"
		      ></v-slider>
		    </v-card-text>
    		
    	</v-card> -->

    	

	 </v-list>
	
</template>

<script type="text/javascript">
	
	import Swatches from 'vue-swatches'
	import "vue-swatches/dist/vue-swatches.min.css"

	export default {
		data () {
			return {
				
			}
		},
		components: { Swatches },
		methods: {

		}
	}
</script>