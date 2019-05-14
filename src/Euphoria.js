import _ from "./Helpers"

import "vuetify/dist/vuetify.min.css"

import Vue from "vue"
import Vuetify from 'vuetify'
import StoreCreator from "store/StoreCreator"
import App from "components/App.vue"
import packageObj from "../package.json"

Vue.use(Vuetify)

window.clog = console.log.bind(console)

class Euphoria {
	constructor ( params ) {

		let $this = this;

		this.dom = document.createElement( "div");
		this.dom.classList.add( "nata" );

		document.body.appendChild( this.dom )

		let $store = this.$store = new StoreCreator( params )

		window.$locale = function ( localeKey ) {
			return $store.getters.translation[ localeKey ] || ""
		}


		this.$store.commit("setRoot", new Vue({
	      	el:  this.dom,
	      	render: createElement => {
			  	const context = {
			  	  	props: {

			  	  	},
			  	};
	
			  	return createElement(App, context);
			},
	      	store : this.$store,
	      	components: { App },
	      	template: '<App/>'
	    }));

	    
		console.log( "%c Coded by @sanyabeast https://github.com/sanyabeast", "color: #f44336; font-weight: bold; font-family: monospace;" )


		this.$root = this.$store.state.$root;
	}
}

export default Euphoria