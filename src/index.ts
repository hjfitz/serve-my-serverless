#!/usr/bin/env node
import express from 'express'
import {createHttpTerminator} from 'http-terminator'
import {createServer, Server} from 'http'
import chokidar from 'chokidar'
import dotenv from 'dotenv-flow'

import {appLogger, logger} from './logger'
import {resolveLambdas} from './lambda-middleware'
import type {AppConfig} from './types'
import config from './config'
import { debounce } from './utils'



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
				debounce(async () => {
					await terminator.terminate()
					// this spawn and save config probably needs abstracting to a new class
					const newServer = await spawnServer(config)
				logger.info('Spawning new server')
					await startServer(newServer, config)
					terminator = createHttpTerminator({server: newServer})
				})
			})
		}, 500);
}

function loadAndLogEnv() {
	logger.info('Loading env fles')
	const files = dotenv.listDotenvFiles(process.cwd())
	files.forEach(f => logger.info(`Loaded env from ${f}`))
	dotenv.config()
}


async function main() {
	loadAndLogEnv()
	const server = await spawnServer(config)
	await startServer(server, config)
	await createWatcher(server, config)
}

void main()
