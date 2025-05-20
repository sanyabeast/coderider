
import "vuetify/dist/vuetify.min.css"

import Vue from "vue"
import Vuex, { Store } from 'vuex'
import Vuetify from 'vuetify'
import AppComponent from "./components/App.vue"

// Import store modules directly
import state from "./store/state"

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

class App {
	dom: HTMLDivElement;
	constructor() {
		// Create DOM container
		this.dom = document.createElement("div");
		this.dom.classList.add("nata");

		document.body.appendChild(this.dom);

		new Vue({
			el: this.dom,
			render: createElement => {
				const context = {
					props: {

					},
				};

				return createElement(AppComponent, context);
			},
			store: new Vuex.Store({
				state: { ...state },
			}),
			components: { App: AppComponent },
			template: '<App/>'
		})

		console.log("%c Coded by @sanyabeast https://github.com/sanyabeast", "color: #f44336; font-weight: bold; font-family: monospace;")

	}
}

export default App