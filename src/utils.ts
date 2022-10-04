import {IncomingHttpHeaders} from 'http'
import {is, isNil, map} from 'ramda'

export function debounce(func: Function, timeout = 350): () => any {
	let timer: ReturnType<typeof setTimeout>
	return (...args: any[]) => {
		clearTimeout(timer)
		timer = setTimeout(() => func(args), timeout)
	}
}

export const titleCase = (word: string): string => word[0].toUpperCase() + word.substring(1).toLowerCase()

export const toUpper = (word: string): string => word.split('-').map(titleCase).join('-')

export function makeHeadersCaseInsensitive (headers: IncomingHttpHeaders): IncomingHttpHeaders {
	const upper = Object.fromEntries(Object.entries(headers).map(([k, v]) => {
		return [toUpper(k), v]
	}))
	return {...headers, ...upper}
}

export const isStringOrNull = (prop: any): boolean => is(String, prop) || isNil(prop)
export const isObjectLiteral = (prop: any): boolean => (!Array.isArray(prop)) && is(Object, prop)
export const stringifySafe = (prop: string | object): string => is(String, prop) ? prop : JSON.stringify(prop)

const isString = is(String)
export const stringifyObjectValues = (obj: Record<string, any>): Record<string, any> => map(v => isString(v) ? v : JSON.stringify(v), obj)
