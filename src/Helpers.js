import { forEach } from "lodash"

class Helpers {
	static copytoClipboard ( str ) {
		const el = document.createElement('textarea');
		el.value = str;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	}
}

export default Helpers