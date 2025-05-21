
import * as Vue from "vue"
import * as Pinia from 'pinia'
import AppComponent from "./components/App.vue"

// Create Pinia store
export const useGameStore = Pinia.defineStore('game', {
	state: () => ({
		paused: false,
		browserName: navigator.userAgent,
		mobileDevice: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	})
})

class App {
	dom: HTMLDivElement;
	constructor() {
		// Create DOM container
		this.dom = document.createElement("div");
		this.dom.classList.add("nata");

		document.body.appendChild(this.dom);

		// Create Vue 3 app with Pinia
		const app = Vue.createApp(AppComponent);
		const pinia = Pinia.createPinia();
		app.use(pinia);
		app.mount(this.dom);

		console.log("%c Coded by @sanyabeast https://github.com/sanyabeast", "color: #f44336; font-weight: bold; font-family: monospace;")
	}
}

export default App