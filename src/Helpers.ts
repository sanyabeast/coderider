import { forEach, isArray } from "lodash"
import { Color, Vector3 } from "three";

export function copytoClipboard(str) {
	const el = document.createElement('textarea');
	el.value = str;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
}

export function cssHex2Hex(hexString) {
	return parseInt(hexString.substring(1), 16)
}

export function nearestMult(num, div, greater, include) {
	return (greater ? Math.ceil((num + (include ? 0 : 1)) / div) * div : Math.floor((num - (include ? 0 : 1)) / div) * div) || 0;
}

export function smoothstep(from, to, transition) {
	return to + ((from - to) * (1 - transition))
}

export function getStep(from, to, position) {
	return 1 - ((to - position) / (to - from))
}

export function makeGetter(object: any, name: string, getterFunction: () => any, setter?: (any) => void) {
	if (typeof object.length == "number") {
		forEach(object, (object) => {
			makeGetter(object, name, getterFunction, setter)
		})

		return
	}

	Object.defineProperty(object, name, {
		get: getterFunction,
		set: setter
	})
}

export async function forEachAsync(collecton, iteratee) {
	if (isArray(collecton)) {
		for (let i = 0; i < collecton.length; i++) {
			await iteratee(collecton[i], i)
		}
	} else {
		for (let k in collecton) {
			await iteratee(collecton[k], k)
		}
	}
}

export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export function lerpV3(a: Vector3, b: Vector3, t: number): Vector3 {
	return new Vector3(
		lerp(a.x, b.x, t),
		lerp(a.y, b.y, t),
		lerp(a.z, b.z, t),
	);
}

export function lerpColor(a: Color, b: Color, t: number): Color {
	return new Color(
		lerp(a.r, b.r, t),
		lerp(a.g, b.g, t),
		lerp(a.b, b.b, t),
	);
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function moveTo(current: number, target: number, delta: number): number {
	if (Math.abs(target - current) <= delta) return target;
	return current + Math.sign(target - current) * delta;
}
