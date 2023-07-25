import {Application} from 'express'
import {join, resolve} from 'path'

import {LambdaMeta} from '../types'
import {logger} from '../logger'
import {lambdaHandler} from './middleware'

export function resolveLambdas(expressApp: Application, lambdas: LambdaMeta[]) {
	return lambdas.map(async(lambdaMeta) => {
		try {
			const modPath = resolve(process.cwd(), lambdaMeta.src)
			const file = await import(modPath)
			delete require.cache[modPath]
			logger.info(`configuring "${lambdaMeta.name}" => "${lambdaMeta.endpoint}"`)
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
