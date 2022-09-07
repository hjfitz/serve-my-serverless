import express from 'express'
import {parse} from 'yaml'
import {readFileSync} from 'fs'
import {join} from 'path'
import dotenv from 'dotenv-flow'

import { appLogger, logger } from './logger'
import { resolveLambdas } from './lambda-middleware'
import type {AppConfig} from './types'


const app = express()

app.use(appLogger)

// todo: arg parsing
async function main() {
	dotenv.config()
	// todo: typecheck, not just assume
	const configPath = join(process.cwd(), 'config.yml')
	const config = parse(readFileSync(configPath).toString()) as AppConfig
	logger.info(`Reading config from ${configPath}`)
	await Promise.all(resolveLambdas(app, config.lambdas))
	await new Promise(res => app.listen(config.port, () => res(null)))
	logger.info(`App listening at http://localhost:${config.port}`)
	config.lambdas.forEach(lambdaMeta => logger.info(`Mounted endpoint: "${lambdaMeta.name}" => http://localhost:${config.port}${lambdaMeta.endpoint}`))

}

void main()


