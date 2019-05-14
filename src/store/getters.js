import _ from "Helpers";


var getters = {
	translation ( state ) {
		return state.translations[ state.language ]
	},
	routes ( state ) {
		return state.routes[ state.currentPage ]
	}
};

export default getters;