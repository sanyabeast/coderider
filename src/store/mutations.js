import _ from "Helpers";

var mutations = {
	setRoot ( state, root ){
		state.$root = root;
	},
	/*l18n*/
	language ( state, language){
		state.language = language;
	},	
	currentPage ( state, pageName ) {
		state.currentPage = pageName
	}
};

export default mutations;