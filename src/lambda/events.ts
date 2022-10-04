import { APIGatewayProxyEvent } from 'aws-lambda'
import { Request } from 'express'
import { either, is, map, pickBy } from 'ramda'
import { isObjectLiteral, isStringOrNull, makeHeadersCaseInsensitive, stringifySafe } from '../utils'


export class EventBuilder {
	constructor(private readonly req: Request) {}
	public proxyEvent(): APIGatewayProxyEvent {
		const {path, method, headers, body, query, params} = this.req
		const stringBody = (isStringOrNull(body) ? body : JSON.stringify(body)) as string | null

		const insensitiveHeaders = makeHeadersCaseInsensitive(headers)
		const multiHeaders = pickBy(Array.isArray, insensitiveHeaders) as Record<string, string[]>
		const singleHeaders = pickBy(is(String), insensitiveHeaders) as Record<string, string>

		const multiQuery = pickBy(Array.isArray, query) as Record<string, string[]>
		const singleQuery = map(pickBy(either(is(String), isObjectLiteral), query), stringifySafe) as Record<string, string>

		return {
			body: stringBody,
			headers: singleHeaders,
			multiValueHeaders: multiHeaders,
			httpMethod: method,
			isBase64Encoded: false,
			path: path,
			pathParameters: params,
			queryStringParameters: singleQuery,
			multiValueQueryStringParameters: multiQuery,
			stageVariables: null,
			resource: '',
			// @ts-ignore
			requestContext: {}
		}
	}

}
