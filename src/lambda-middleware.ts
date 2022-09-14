import type {APIGatewayProxyEvent, Handler} from 'aws-lambda'
import type {Application, Request, Response} from 'express'

import type {LambdaMeta, LambdaResponse} from './types'
import {join} from 'path'
import {logger} from './logger'
import {either, is, isNil, pickBy, map} from 'ramda'

const isStringOrNull = (prop: any) => is(String, prop) || isNil(prop)
const isObjectLiteral = (prop: any) => (!Array.isArray(prop)) && is(Object, prop)
const stringifySafe = (prop: string | object) => is(String, prop) ? prop : JSON.stringify(prop)

function createProxyEvent(req: Request): APIGatewayProxyEvent {
	const body = (isStringOrNull(req.body) ? req.body : JSON.stringify(req.body)) as string | null

	const multiHeaders = pickBy(Array.isArray, req.headers) as Record<string, string[]>
	const singleHeaders = pickBy(is(String), req.headers) as Record<string, string>

	const multiQuery = pickBy(Array.isArray, req.query) as Record<string, string[]>
	const singleQuery = map(pickBy(either(is(String), isObjectLiteral), req.query), stringifySafe) as Record<string, string>

	return {
		body,
		headers: singleHeaders,
		multiValueHeaders: multiHeaders,
		httpMethod: req.method,
		isBase64Encoded: false,
		path: req.path,
		pathParameters: req.params,
		queryStringParameters: singleQuery,
		multiValueQueryStringParameters: multiQuery, // todo: parse
		stageVariables: null,
		resource: '',
		// @ts-ignore
		requestContext: {}
	}

}

export function lambdaHandler(lambda: Handler, meta: LambdaMeta) {
	return async function(req: Request, res: Response) {
		const cb = (err?: Error | string | null, result?: LambdaResponse) => {
			if (err) {
				if (err instanceof Error) {
					res.status(500).send(err.message)
				} else {
					res.status(500).send(err)
				}
			} else {
				const {statusCode, body} = result ?? {statusCode: 200, body: 'ok'}
				res.status(statusCode).send(body)
			}

		}
		// @ts-expect-error not all fields present
		const context: Context = {
			functionName: meta.name,
			invokedFunctionArn: 'local',
			callbackWaitsForEmptyEventLoop: false,
			awsRequestId: 'local',
		}

		const event = createProxyEvent(req)

		try {
			const {statusCode, body} = await lambda(event, context, cb)
			res.status(statusCode).send(body)
		} catch (err) {
			if (err instanceof Error) {
				res.status(500).send(`Error: ${err.message}`)
			} else {
				res.status(500).send(err)
			}
		}
	}
}


export function resolveLambdas(expressApp: Application, lambdas: LambdaMeta[]) {
	return lambdas.map(async (lambdaMeta) => {
		try {
			const importPath = join(process.cwd(), lambdaMeta.src)
			const file = await import(importPath)
			expressApp.all(lambdaMeta.endpoint, lambdaHandler(file[lambdaMeta.export], lambdaMeta))
		} catch (e: unknown) {
			logger.warn(lambdaMeta, 'Unable to configure lambda')
			if (e instanceof Error) {
				logger.warn('error:')
				logger.warn(e.message)
			}
		}
	})
}
