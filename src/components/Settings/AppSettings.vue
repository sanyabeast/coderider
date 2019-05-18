<template>

	  <v-list
	    subheader
	    two-line
	  >

	  	<v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.wireframeMode"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.wireframeMode = !$store.state.wireframeMode;">
	        <v-list-tile-title>Режим Wireframe</v-list-tile-title>
	        <v-list-tile-sub-title>Включение и отключение</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>


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

    	<v-subheader>Настройки постобработки</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-checkbox v-model="$store.state.fxEnabled"></v-checkbox>
	      </v-list-tile-action>

	      <v-list-tile-content @click="$store.state.fxEnabled = !$store.state.fxEnabled;">
	        <v-list-tile-title>Активно</v-list-tile-title>
	        <v-list-tile-sub-title>Включить или отключить постобработку</v-list-tile-sub-title>
	      </v-list-tile-content>
	    </v-list-tile>


    	<v-subheader>Настройки транспорта</v-subheader>

    	<v-card flat color="transparent">
	    	<v-subheader>Мощность двигателя</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.enginePower"
	            	thumb-label="always"
	            	min="0"
	            	step="0.5"
	            	max="10"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-subheader>Настройки поверхности</v-subheader>

    	<v-card flat color="transparent">
	    	<v-subheader>Трение поверхности</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.groundFriction"
	            	thumb-label="always"
	            	min="0"
	            	step="0.1"
	            	max="1"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-card flat color="transparent">
	    	<v-subheader>Упругость поверхности</v-subheader>
  
		    <v-card-text class="pt-0">
		      	<v-slider
	            	v-model="$store.state.groundRestirution"
	            	thumb-label="always"
	            	min="0"
	            	step="0.1"
	            	max="0.9"
		        ></v-slider>
		    </v-card-text>
    		
    	</v-card>

    	<v-subheader>Текстура поверхности</v-subheader>

	    <v-list-tile>
	      <v-list-tile-action>
	        <v-select
		        v-model="$store.state.groundSkin"
	            :items="groundSkins"
	            :label="$store.state.groundSkin"
	        ></v-select>
	      </v-list-tile-action>
	    </v-list-tile>

	  </v-list>

	  </v-list>
	
</template>

<script type="text/javascript">
	
	import { mapState } from 'vuex';
	import { map } from "lodash"

	export default {
		data () {
			return {
				groundSkins: []
			}
		},
		mounted () {
			this.groundSkins = map( this.$store.state.config.groundSkins, ( data )=>{
				return data.name
			} )
		}
	}
</script>