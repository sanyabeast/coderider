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

	static cssHex2Hex ( hexString ) {
		return parseInt( hexString.substring(1), 16 )
	}
}

export default Helpers