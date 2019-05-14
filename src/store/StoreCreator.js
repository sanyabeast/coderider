import Vue from 'vue';
import Vuex from 'vuex';
import _ from "Helpers";

import state from "store/state";
import getters from "store/getters";
import mutations from "store/mutations";
import modules from "store/modules";
import actions from "store/actions";

Vue.use(Vuex);

class StoreCreator {
	constructor(params){
		
		this.store = new Vuex.Store({
		  	state : {...state, ...params},
		  	actions,
		  	mutations,
		  	getters,
		  	modules
		});

		return this.store;
	}
}


export default StoreCreator; 