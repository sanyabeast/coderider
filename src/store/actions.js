import _ from "Helpers";
import { forEach } from "lodash"
import screenfull from "screenfull"

var actions = {
	nextPage ( store ) {
		let currentPage = store.state.currentPage
		let currentPageRoutes = store.state.routes[ currentPage ]

		store.state.currentPage = currentPageRoutes[1]
	},
	prevPage ( store ) {
		let currentPage = store.state.currentPage
		let currentPageRoutes = store.state.routes[ currentPage ]

		store.state.currentPage = currentPageRoutes[0]
	},
	native ( store, params ) {
		if ( "native" in window ) {
			try {
				window.native[ params.method ]( ...params.args )
			} catch ( err ) {} 
		}
	},
	save ( store ) {
		let saveData = {}

		forEach( store.state.savedProps, ( key )=>{
			saveData[key] = store.state[key]
		} )

		try {
			localStorage.setItem( "demo_101_save", JSON.stringify( saveData ) )
		} catch ( err ) {
			console.log( err )
		}
	},
	load ( store, data ) {
		let saveData = {}


		if ( data ) {
			saveData = data
		} else {
			try {
				saveData = JSON.parse( localStorage.getItem( "demo_101_save" ) )
			} catch ( err ) {
				console.log( err )
			}

		}

		forEach( saveData, ( value, key )=>{
			store.state[ key ] = value
		} )
	},
	loadDefaults ( store ) {
		store.dispatch( "load", store.state.defaultSettings )
		store.dispatch( "save" )
	},
	checkFullscreen ( store ) {
		if (!store.state.isHybridApp && store.state.mobileDevice && store.state.browserName != "safari"){
            screenfull.request()
        }
	}
};

export default actions;