<template>

	  <v-list
	    subheader
	    two-line
	  >
	    <v-subheader>Настройки физической симуляции</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.physicEnabled"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.physicEnabled = !$store.state.physicEnabled">
	        <v-list-tile-title>Активно</v-list-tile-title>
	        <v-list-tile-sub-title>Включить отключить физику</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-subheader>Настройки гравитации</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.gyroGravityEnabled"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.gyroGravityEnabled = !$store.state.gyroGravityEnabled">
	        <v-list-tile-title>Гирометр (Android)</v-list-tile-title>
	        <v-list-tile-sub-title>Управлять гравитацией гирометром</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>

	    <v-card flat color="transparent">
	    	<v-subheader>Сила гравитации по оси X</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.gravityX"
	            	thumb-label="always"
	            	min="-1"
	            	step="0.1"
	            	max="1"
	            	:disabled="$store.state.gyroGravityEnabled"
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
	            	:disabled="$store.state.gyroGravityEnabled"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

	    <v-subheader>Параметры объектов</v-subheader>

	    <v-card flat color="transparent">
	    	<v-subheader>Трение объектов</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.matterObjectsFriction"
	            	thumb-label="always"
	            	min="0"
	            	step="0.01"
	            	max="1"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	 <v-card flat color="transparent">
	    	<v-subheader>Трение воздуха</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.matterObjectsFrictionAir"
	            	thumb-label="always"
	            	min="0"
	            	step="0.01"
	            	max="1"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-card flat color="transparent">
	    	<v-subheader>Упругость объектов</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.matterObjectsRestitution"
	            	thumb-label="always"
	            	min="0.05"
	            	step="0.05"
	            	max="0.95"
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