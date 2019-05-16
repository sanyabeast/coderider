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

	static nearestMult (num, div, greater, include) {
        return (greater ? Math.ceil((num + (include?0:1))/div)*div: Math.floor((num - (include?0:1))/div)*div) || 0;
    }

    static smoothstep ( from, to, transition ) {
    	return to + ( ( from - to ) * ( 1 - transition ) )
    }

    static getter( object, name, getter, setter ) {
    	Object.defineProperty( object, name, {
    		get: getter,
    		set: setter
    	} )
    }
}

export default Helpers