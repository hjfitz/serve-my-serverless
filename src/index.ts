import express from 'express'
import {createHttpTerminator} from 'http-terminator'
import chokidar from 'chokidar'
import {parse} from 'yaml'
import {readFileSync} from 'fs'
import {join} from 'path'
import dotenv from 'dotenv-flow'

import {appLogger, logger} from './logger'
import {resolveLambdas} from './lambda-middleware'
import type {AppConfig} from './types'
import { createServer, Server } from 'http'


async function spawnServer(config: AppConfig): Promise<Server> {
	const app = express()
	app.use(appLogger)
	await Promise.all(resolveLambdas(app, config.lambdas))
	const server = createServer(app)
	return server
}

async function startServer(server: Server, config: AppConfig) {
	try {
		await new Promise(res => server.listen(config.port, () => res(null)))
		logger.info(`App listening at http://localhost:${config.port}`)
		config.lambdas.forEach(lambdaMeta => logger.info(`Mounted endpoint: "${lambdaMeta.name}" => http://localhost:${config.port}${lambdaMeta.endpoint}`))
	} catch (err) {
		logger.debug('Unable to spawn server, trying again')
		setTimeout(() => startServer(server, config), 100)
	}
}

async function createWatcher(server: Server, config: AppConfig) {
		// we could get clever and pass a root dir as an arg
		const root = process.cwd()
		const watcher = chokidar.watch(root)
		let terminator = createHttpTerminator({server})

		setTimeout(() => {
			logger.info(`Started watching ${root}`)
			watcher.on('all', async () => {
				logger.info('New changes found. Killing server')
				await terminator.terminate()
				// this spawn and save config probably needs abstracting to a new class
				const newServer = await spawnServer(config)
				logger.info('Spawning new server')
				await startServer(newServer, config)
				terminator = createHttpTerminator({server: newServer})
			})
		}, 500);
}


// todo: arg parsing
async function main() {
	dotenv.config()
	const configPath = join(process.cwd(), 'config.yml')
	logger.info(`Reading config from ${configPath}`)
	// todo: typecheck, not just assume
	const config = parse(readFileSync(configPath).toString()) as AppConfig
	const server = await spawnServer(config)
	await startServer(server, config)
	await createWatcher(server, config)

}

void main()


