import {Application} from 'express'
import {join} from 'path'

import {LambdaMeta} from '../types'
import {logger} from '../logger'
import {lambdaHandler} from './middleware'

export function resolveLambdas(expressApp: Application, lambdas: LambdaMeta[]) {
	return lambdas.map(async(lambdaMeta) => {
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
