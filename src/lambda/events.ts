import {APIGatewayProxyEvent, APIGatewayProxyEventV2} from 'aws-lambda'
import {Request} from 'express'
import {either, is, map, pickBy} from 'ramda'
import {isObjectLiteral, isStringOrNull, makeHeadersCaseInsensitive, md5, stringifyObjectValues, stringifySafe} from '../utils'
import {randomUUID, subtle} from 'node:crypto'
import {format} from 'date-fns'
import {logger} from '../logger'

export enum EventType { 
	SQS = 'SQS',
	APIGATEWAY = 'API Gateway',
	APIGATEWAYV2 = 'API Gateway V2', 
}

export class EventBuilder {
	private body: string | null
	constructor(
          private readonly req: Request, 
          private readonly eventType: EventType
	) {
		this.body = isStringOrNull(this.req.body) ? this.req.body : JSON.stringify(this.req.body)
	}

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
			// temp fix
			queryStringParameters: query as Record<string, string>, //singleQuery as Record<string, string>,
			multiValueQueryStringParameters: multiQuery as Record<string, string[]>,
			stageVariables: null,
			resource: '',
			// @ts-expect-error
			requestContext: {}
		}
	}

	public proxyEventV2(): APIGatewayProxyEventV2 {
		const {cookies, headers, query, params, path, url, method, protocol, ip} = this.req

		const now = new Date()


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
			body: this.body ?? undefined,
			pathParameters: params,
			isBase64Encoded: false,
			stageVariables: undefined
		}
	}

	public sqsEvent() {
		const hash = md5(this.body ?? '')
		return {
			Records: [
				{
					messageId: randomUUID(),
					receiptHandle: randomUUID().replace(/-/g, ''),
					body: this.body ?? undefined,
					attributes: {
						ApproximateReceiveCount: '1',
						SentTimestamp: new Date().getTime().toString(),
						SenderId: randomUUID(),
						ApproximateFirstReceiveTimestamp: new Date().getTime().toString()
					},
					messageAttributes: {},
					md5OfBody: hash,
					eventSource: 'aws:sqs',
					eventSourceARN: 'arn:aws:sqs:local:000000000000:simulation',
					awsRegion: 'local'
				}
			]
		}

	}

	public build() {
		logger.debug(`Building event of type ${this.eventType}`)
		switch (this.eventType) {
		case EventType.SQS:
			return this.sqsEvent()
		case EventType.APIGATEWAY:
			return this.proxyEvent()
		case EventType.APIGATEWAYV2:
			return this.proxyEventV2()
		}
	}
}
