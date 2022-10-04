import dotenv from 'dotenv-flow'
import {logger} from '../logger'

export function loadAndLogEnv (): void {
	logger.info('Loading env fles')
	const beforeEnv = Object.keys(process.env)
	const files = dotenv.listDotenvFiles(process.cwd())
	files.forEach(f => logger.info(`Loaded env from ${f}`))
	dotenv.config()
	const afterEnv = Object.keys(process.env)
	const loadedVariables = afterEnv.filter(v => !beforeEnv.includes(v)).join('\n\t> ')
	logger.info(`From env, loaded: \n\t> ${loadedVariables}`)
}
