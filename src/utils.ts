import {createHash} from 'crypto'
import {IncomingHttpHeaders} from 'http'
import crypto from 'node:crypto'
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

export const isString = is(String)
export const isStringOrNull = (prop: unknown): boolean => isString(prop) || isNil(prop)
export const isObjectLiteral = (prop: unknown): boolean => (!Array.isArray(prop)) && is(Object, prop)
export const stringifySafe = (prop: string | object): string => isString(prop) ? prop : JSON.stringify(prop)

export const isNum = (prop: unknown): boolean => is(Number, prop)
export const stringifyObjectValues = (obj: Record<string, unknown>): Record<string, unknown> => map(v => isString(v) ? v : JSON.stringify(v), obj)


export const md5 = async(msg: string): Promise<string> => createHash('md5').update(msg).digest('hex')

