import {z} from 'zod'
import dotenv from 'dotenv-flow'
import {logger} from '../logger'
import {AppConfig, ParamConfig} from '../types'
import {basename, join} from 'path'
import {parse, stringify} from 'yaml'
import {readFileSync, writeFileSync} from 'fs'
import {Command} from 'commander'
import {isEmpty} from 'ramda'
import {isNum} from '../utils'
import {IConfigService} from './types'
import {EventType} from '../lambda'

export class ConfigError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ConfigError'
	}
}

function deriveEventType(type?: string): EventType {
	switch (type) {
	case 'sqs': {
		return EventType.SQS
    
	}
	case 'apig': 
	default: {
		return EventType.APIGATEWAY
	}
	}
}


export class ConfigService extends IConfigService {

	private readonly schema = z.object({
		port: z.number().int().max(65535).default(3000),
		verbose: z.boolean().optional(),
		lambdas: z.array(
			z.object({
				src: z.string(),
				name: z.string(),
				endpoint: z.string().startsWith('/'),
				export: z.string(),
				eventType: z.string().optional().transform(deriveEventType),
			})
		)
	})

	public config: AppConfig

	constructor() {
		super()
		this.refreshConfig = this.refreshConfig.bind(this)
		this.config = this.getConfig()
		this.loadEnv(this.config.verbose ?? false)
	}


	protected loadEnv(verbose: boolean): void {
		logger.info('Loading env fles')
		const beforeEnv = Object.keys(process.env)
		const files = dotenv.listDotenvFiles(process.cwd())
		files.forEach(f => logger.info(`Loaded env from ./${basename(f)}`))
		dotenv.config({silent: true})
		const afterEnv = Object.keys(process.env)
		let loadedVariables = ''
		if (verbose) {
			loadedVariables = afterEnv.filter(v => !beforeEnv.includes(v)).map(v => `${v}=${process.env[v] ?? ''}`).join('\n\t> ')
		} else {
			loadedVariables = afterEnv.filter(v => !beforeEnv.includes(v)).join('\n\t> ')
		}
		if (loadedVariables.length) {
			logger.info(`From env, loaded: \n\t> ${loadedVariables}`)
		} else {
			logger.info('No new env variables loaded')
		}
	}

	protected loadFromFile(): AppConfig | null {
		const configPath = join(process.cwd(), 'config.yml')
		try {
			const rawConfig = parse(readFileSync(configPath, 'utf-8'))
			logger.info('Read config from ./config.yml')
			const parsedConfig = this.schema.parse(rawConfig)
			logger.info('Config validated')
			return parsedConfig
		} catch (err) {
			if ((err as any).code === 'ENOENT') {
				return null
			}


			logger.warn('Unable to parse config file')
			if (err instanceof Error) {
				logger.warn(err.message)
			} else {
				logger.warn(err as string)
			}
			return null
		}
	}

	private createConfigFile(): void {
		const config = {
			port: 3001,
			lambdas: [{
				src: './lambda.ts',
				name: 'lambda_handler',
				endpoint: '/',
				export: 'lambda_handler',
				eventType: 'APIGATEWAY'
			}]
		}
		const stringConfig = stringify(config, {indent: 2})
		const configName = join(process.cwd(), 'config.yml')

		writeFileSync(configName, stringConfig)
	}


	protected loadFromArgs(): AppConfig | null {
		const prog = new Command()

		// use the filename as the endpoint. If the filename is index.*, use the parent dir
		const opts = prog
			.option('-r, --route <route>', 'API route to host your lambda handler')
			.option('-p, --port <port>', 'Port to host your lambda')
			.option('-f, --file <file>', 'File to load')
			.option('-v, --verbose', 'Be verbose with outputs')
			.option('-e, --export <exports>', 'Exports to import and run. Defaults to `lambda_handler`')
			.option('-t, --type <event-type>', 'Event type to use. SQS or APIG. Defaults to `APIG')
			.option('-i, --init', 'Initialize a new config file')
			.parse(process.argv)
			.opts<ParamConfig>()

		if (isEmpty(opts)) return null

		if (opts.init) {
			this.createConfigFile()
			process.exit(0)
		}

		logger.info('Using args for config')

		const path = opts.route ?? '/'
		const handler = opts.export ?? 'lambda_handler'

		if (opts.file === undefined) {
			throw new ConfigError('File to import not passed')
		}

		const port = Number(opts.port)

		return {
			port: isNum(port) ? port : 3000,
			verbose: opts.verbose === true,
			lambdas: [{
				src: opts.file,
				name: 'local',
				endpoint: path,
				export: handler,
				eventType: deriveEventType(opts.type)
			}]
		}

	}

	protected getConfig(): AppConfig {

		let config = this.loadFromFile()

		if (!config) {
			logger.info('No config file found')
			config = this.loadFromArgs()
		} else {
			logger.info('Using file-based config')
		}

		if (!config) {
			logger.error('No config found. Exiting')
			process.exit(1)
		} else {
			logger.info('Config loaded from args')
		}

		return config
	}

	public refreshConfig(): void {
		logger.info('Refreshing config')
		const config = this.getConfig()
		this.loadEnv(!!config.verbose)
		this.config = config
	}


}
