<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Настройки физической симуляции</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.physicsEnabled"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.physicsEnabled = !$store.state.physicsEnabled">
	        <v-list-tile-title>Активно</v-list-tile-title>
	        <v-list-tile-sub-title>Включить отключить физику</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-subheader>Настройки гравитации</v-subheader>

	    <v-card flat color="transparent">
	    	<v-subheader>Сила гравитации по оси X</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.gravityX"
	            	thumb-label="always"
	            	min="-1"
	            	step="0.1"
	            	max="1"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-card flat color="transparent">
	    	<v-subheader>Сила гравитации по оси Y</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.gravityY"
	            	thumb-label="always"
	            	min="-1"
	            	step="0.01"
	            	max="1"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-card flat color="transparent">
	    	<v-subheader>Масштаб времени</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.timeScale"
	            	thumb-label="always"
	            	min="0"
	            	step="0.01"
	            	max="1"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

	  </v-list>
	
</template>

<script type="text/javascript">
	
	export default {
		data () {
			return {

			}
		}
	}
</script>