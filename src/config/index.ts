import {z} from 'zod'
import dotenv from 'dotenv-flow'
import {logger} from '../logger'
import {AppConfig, ParamConfig} from '../types'
import {join} from 'path'
import {parse} from 'yaml'
import {readFileSync} from 'fs'
import {Command} from 'commander'
import {isEmpty} from 'ramda'
import {isNum} from '../utils'

export class ConfigError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ConfigError'
	}
}

export class ConfigService {

	private readonly schema = z.object({
		port: z.number(),
		verbose: z.boolean().optional(),
		lambdas: z.array(
			z.object({
				src: z.string(),
				name: z.string(),
				endpoint: z.string().startsWith('/'),
				export: z.string()
			})
		)
	})

	public config: AppConfig

	constructor() {
		this.refreshConfig = this.refreshConfig.bind(this)
		this.config = this.getConfig()
		this.loadEnv(this.config.verbose ?? false)
	}


	private loadEnv(verbose: boolean): void {
		logger.info('Loading env fles')
		const beforeEnv = Object.keys(process.env)
		const files = dotenv.listDotenvFiles(process.cwd())
		files.forEach(f => logger.info(`Loaded env from ${f}`))
		dotenv.config({silent: true})
		const afterEnv = Object.keys(process.env)
		let loadedVariables = ''
		if (verbose) {
			loadedVariables = afterEnv.filter(v => !beforeEnv.includes(v)).map(v => `${v}=${process.env[v] ?? ''}`).join('\n\t> ')
		} else {
			loadedVariables = afterEnv.filter(v => !beforeEnv.includes(v)).join('\n\t> ')
		}
		logger.info(`From env, loaded: \n\t> ${loadedVariables}`)
	}

	private loadFromFile(): AppConfig | null {
		const configPath = join(process.cwd(), 'config.yml')
		logger.info(`Reading config from ${configPath}`)
		try {
			const rawConfig = parse(readFileSync(configPath, 'utf-8'))
			const parsedConfig = this.schema.parse(rawConfig)
			logger.info('Config validated')
			return parsedConfig
		} catch (err) {
			logger.warn('Unable to parse config file')
			if (err instanceof Error) {
				logger.warn(err.message)
			} else {
				logger.warn(err as string)
			}
			return null
		}
	}

	private loadFromArgs(): AppConfig | null {
		const prog = new Command()

		// use the filename as the endpoint. If the filename is index.*, use the parent dir
		const opts = prog
			.option('-r, --route <route>', 'API route to host your lambda handler')
			.option('-p, --port <port>', 'Port to host your lambda')
			.option('-f, --file <file>', 'File to load')
			.option('-v, --verbose', 'Be verbose with outputs')
			.option('-e, --export <exports>', 'Exports to import and run. Defaults to `lambda_handler`')
			.parse(process.argv)
			.opts<ParamConfig>()

		if (isEmpty(opts)) return null

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
				export: handler
			}]
		}

	}

	private getConfig(): AppConfig {

		let config = this.loadFromFile()

		if (!config) {
			logger.info('No file config found. Using args config')
			config = this.loadFromArgs()
		} else {
			logger.info('Using file config')
		}

		if (!config) {
			logger.error('No config found. Exiting')
			process.exit(1)
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
