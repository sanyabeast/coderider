import _ from "./Helpers"

import "vuetify/dist/vuetify.min.css"

import Vue from "vue"
import Vuex from 'vuex'
import Vuetify from 'vuetify'
import AppComponent from "components/App.vue"
import packageObj from "../package.json"

// Import store modules directly
import state from "store/state"
import getters from "store/getters"
import mutations from "store/mutations"
import modules from "store/modules"
import actions from "store/actions"

// Setup Vue plugins
Vue.use(Vuex)
Vue.use(Vuetify, {
	theme: {
	    primary: '#ff8400',
	    secondary: '#ffffff',
	    accent: '#ff8400',
	    error: '#b71c1c'
	}
})

window.clog = console.log.bind(console)

class App {
	constructor(params) {
		// Create DOM container
		this.dom = document.createElement("div");
		this.dom.classList.add("nata");
		document.body.appendChild(this.dom);

		// Create store directly
		this.$store = new Vuex.Store({
			state: {...state, ...params},
			actions,
			mutations,
			getters,
			modules
		});

		// With the removal of translations functionality, this is no longer needed
		// But keeping a stub for backward compatibility
		window.$locale = function (localeKey) {
			return localeKey || ""
		}

		this.$store.commit("setRoot", new Vue({
	      	el:  this.dom,
	      	render: createElement => {
			  	const context = {
			  	  	props: {

			  	  	},
			  	};
	
			  	return createElement(AppComponent, context);
			},
	      	store : this.$store,
	      	components: { App: AppComponent },
	      	template: '<App/>'
	    }));

	    
		console.log( "%c Coded by @sanyabeast https://github.com/sanyabeast", "color: #f44336; font-weight: bold; font-family: monospace;" )


		this.$root = this.$store.state.$root;
	}
}

export default App