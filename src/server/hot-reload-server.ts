import express from 'express'
import {createServer, Server} from 'http'
import {createHttpTerminator, HttpTerminator} from 'http-terminator'

import {resolveLambdas} from '../lambda'
import {loggerMiddleware, logger} from '../logger'
import {AppConfig, LambdaMeta} from '../types'

export class HotReloadServer {
	private readonly port: number
	private readonly lambdas: LambdaMeta[]
	private terminator: HttpTerminator | null = null
	private server: Server | null = null

	constructor (config: AppConfig) {
		this.port = config.port
		this.lambdas = config.lambdas
		this.respawn = this.respawn.bind(this)
	}

	private async createServer (): Promise<void> {
		const app = express()
		app.use(loggerMiddleware)
		await Promise.all(resolveLambdas(app, this.lambdas))
		this.server = createServer(app)
	}

	public async respawn (backoffMs = 150, maxRetries = 3): Promise<void> {
		if (this.server === null) {
			await this.createServer()
		}
		try {
			if (this.terminator != null) {
				await this.terminator.terminate()
			}
			this.terminator = createHttpTerminator({server: this.server!})
			await new Promise(res => this.server!.listen(this.port, () => res(null)))
			logger.info(`App listening at http://localhost:${this.port}`)
			this.lambdas.forEach(lambdaMeta => logger.info(`Mounted endpoint: "${lambdaMeta.name}" => http://localhost:${this.port}${lambdaMeta.endpoint}`))
		} catch (err) {
			logger.debug('Unable to spawn server, trying again')
			if (maxRetries === 0) {
				logger.error('Unable to spawn server')
				throw err
			}
			setTimeout(() => {
				void this.respawn(backoffMs * maxRetries - 1)
			}, 150)
		}
	}
}
