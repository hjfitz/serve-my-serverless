import type {Handler} from 'aws-lambda'
import type { Application, Request, Response } from 'express'

import type {LambdaMeta, LambdaResponse} from './types'
import {join} from 'path'
import { logger } from './logger'

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

		try {
			// better types needed here! I'll probably pick them up as I work with lambda more
			const event = {...req.body, headers: req.headers}
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


// param hack
export function resolveLambdas(expressApp: Application, lambdas: LambdaMeta[]) {
	return lambdas.map(async (lambdaMeta) => {
		try {
			const importPath = join(process.cwd(), lambdaMeta.src)
			const file = await import(importPath)
			expressApp.all(lambdaMeta.endpoint, lambdaHandler(file[lambdaMeta.export], lambdaMeta))
		} catch (e: unknown) {
			logger.warn('Unable to configure lambda', lambdaMeta)
			if (e instanceof Error) {
				logger.warn('error:')
				logger.warn(e.message)
			}
		}
	})
}
