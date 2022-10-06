import {APIGatewayProxyEvent, APIGatewayProxyEventV2} from 'aws-lambda'
import {Request} from 'express'
import {either, is, map, pickBy} from 'ramda'
import {isObjectLiteral, isStringOrNull, makeHeadersCaseInsensitive, stringifyObjectValues, stringifySafe} from '../utils'
import {randomUUID} from 'node:crypto'
import {format} from 'date-fns'

export class EventBuilder {
	constructor(private readonly req: Request) {}
	public proxyEvent(): APIGatewayProxyEvent {
		const {path, method, headers, body, query, params} = this.req
		const stringBody = (isStringOrNull(body) ? body : JSON.stringify(body)) as string | null

		const insensitiveHeaders = makeHeadersCaseInsensitive(headers)
		const multiHeaders = pickBy(Array.isArray, insensitiveHeaders)
		const singleHeaders = pickBy(is(String), insensitiveHeaders)

		const multiQuery = pickBy(Array.isArray, query)
		const singleQuery = map(pickBy(either(is(String), isObjectLiteral), query), stringifySafe)

		return {
			body: stringBody,
			headers: singleHeaders as Record<string, string>,
			multiValueHeaders: multiHeaders as Record<string, string[]>,
			httpMethod: method,
			isBase64Encoded: false,
			path,
			pathParameters: params,
			queryStringParameters: singleQuery as Record<string, string>,
			multiValueQueryStringParameters: multiQuery as Record<string, string[]>,
			stageVariables: null,
			resource: '',
			// @ts-expect-error
			requestContext: {}
		}
	}

	public proxyEventV2(): APIGatewayProxyEventV2 {
		const {body, cookies, headers, query, params, path, url, method, protocol, ip} = this.req

		const now = new Date()

		const stringBody = (isStringOrNull(body) ? body : JSON.stringify(body)) as string | null
		const stringHeaders = stringifyObjectValues(headers)
		const stringParams = stringifyObjectValues(query)
		return {
			version: '2',
			routeKey: '$default',
			rawPath: this.req.path,
			rawQueryString: new URL(url).search,
			cookies,
			// @ts-ignore
			headers: stringHeaders,
			// @ts-ignore
			queryStringParameters: stringParams,
			requestContext: {
				accountId: 'LOCALDEV',
				apiId: 'lcl-api',
				domainName: 'localhost',
				domainPrefix: '',
				http: {
					method,
					path,
					protocol,
					sourceIp: ip,
					userAgent: this.req.headers['user-agent'] ?? 'Not specified'
				},
				requestId: randomUUID(),
				routeKey: '$default',
				stage: '$default',
				time: format(now, 'dd/LLL/yyyy:HH:mm:ss xx'),
				timeEpoch: now.getTime()
			},
			body: stringBody ?? undefined,
			pathParameters: params,
			isBase64Encoded: false,
			stageVariables: undefined
		}
	}
}
