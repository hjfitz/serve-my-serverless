import {IncomingHttpHeaders} from 'http'
import {is, isNil, map} from 'ramda'

type UnknownFn = (...args: unknown[]) => unknown

export function debounce<T extends UnknownFn>(func: T, timeout = 350): (...args: unknown[]) => void {
	let timer: ReturnType<typeof setTimeout>
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => func(args), timeout)
	}
}

export const titleCase = (word: string): string => word[0].toUpperCase() + word.substring(1).toLowerCase()

export const toUpper = (word: string): string => word.split('-').map(titleCase).join('-')

export function makeHeadersCaseInsensitive(headers: IncomingHttpHeaders): IncomingHttpHeaders {
	const upper = Object.fromEntries(Object.entries(headers).map(([k, v]) => {
		return [toUpper(k), v]
	}))
	return {...headers, ...upper}
}

export const isStringOrNull = (prop: unknown): boolean => is(String, prop) || isNil(prop)
export const isObjectLiteral = (prop: unknown): boolean => (!Array.isArray(prop)) && is(Object, prop)
export const stringifySafe = (prop: string | object): string => is(String, prop) ? prop : JSON.stringify(prop)

const isString = is(String)
export const stringifyObjectValues = (obj: Record<string, unknown>): Record<string, unknown> => map(v => isString(v) ? v : JSON.stringify(v), obj)
