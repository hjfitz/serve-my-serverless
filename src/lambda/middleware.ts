import type {Handler} from 'aws-lambda'
import type {Request, Response} from 'express'

import {EventBuilder, EventType} from './events'
import type {LambdaMeta, LambdaResponse} from '../types'
import {createContext} from './context'

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

		const context = createContext(meta.name)
		const builder = new EventBuilder(req, meta.eventType)
		
		const event = builder.build()

		try {
			const {statusCode, body, headers} = await lambda(event, context, cb)
			if (headers) res.set(headers)
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
