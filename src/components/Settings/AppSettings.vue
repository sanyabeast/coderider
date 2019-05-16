<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Настройки камеры</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.freeCamera"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.freeCamera = !$store.state.freeCamera; $store.state.speedCamera = !$store.state.freeCamera;">
	        <v-list-tile-title>Свободное отдаление</v-list-tile-title>
	        <v-list-tile-sub-title>Приближение и отдаление</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-card flat color="transparent">
	    	<v-subheader>Отдаление камеры</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.freeCameraZ"
	            	thumb-label="always"
	            	min="10"
	            	step="10"
	            	max="2500"
	            	:disabled="!$store.state.freeCamera"
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