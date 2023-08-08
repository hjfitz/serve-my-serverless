import express from 'express'
import {createServer, Server} from 'http'
import {createHttpTerminator, HttpTerminator} from 'http-terminator'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import {ConfigService} from '../config'

import {resolveLambdas} from '../lambda'
import {loggerMiddleware, logger} from '../logger'
import {LambdaMeta} from '../types'

export class HotReloadServer {
	private readonly port: number
	private lambdas: LambdaMeta[]
	private terminator: HttpTerminator | null = null
	private server: Server | null = null

	constructor(private configService: ConfigService) {
		this.port = this.configService.config.port
		this.lambdas = this.configService.config.lambdas
		this.respawn = this.respawn.bind(this)
		this.createServer = this.createServer.bind(this)
		this.refreshConfig = this.refreshConfig.bind(this)
	}

	private async createServer(): Promise<void> {
		const app = express()
		app.use(loggerMiddleware)
		app.use(bodyParser.json())
		app.use(cookieParser())
		logger.info('Resolving lambdas')
		await new Promise(res => setTimeout(res, 250))
		await Promise.all(resolveLambdas(app, this.lambdas))
		this.server = createServer(app)
	}

	private listen(): Promise<void> {
		if (!this.server) {
			throw new Error('server not initialised')
		}
		return new Promise(res => {
			this.server!.listen(this.port, () => {
				logger.info(`App listening at http://localhost:${this.port}`)
				res()
			})
		})
	}

	private refreshConfig(): void {
		this.configService.refreshConfig()
		this.lambdas = this.configService.config.lambdas
	}

	public async respawn(backoffMs = 150, maxRetries = 3): Promise<void> {
		this.refreshConfig()
		try {
			// ugly block start
			if (this.terminator !== null) {
				await this.terminator.terminate()
				await this.createServer()
			}
			if (this.server === null) {
				await this.createServer()
			}
			// ugly block end
			await this.listen()
			this.terminator = createHttpTerminator({server: this.server!})
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
