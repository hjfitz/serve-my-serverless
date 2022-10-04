import {Command} from 'commander'
import {parse} from 'yaml'
import {readFileSync} from 'fs'
import {join} from 'path'
import {isEmpty} from 'ramda'

import {logger} from '../logger'
import {z} from 'zod'
import {AppConfig} from '../types'

const configSchema = z.object({
	port: z.number(),
	lambdas: z.optional(z.array(
		z.object({
			src: z.string(),
			name: z.string(),
			endpoint: z.string().startsWith('/'),
			export: z.string(),
		}),
	))
})

class ConfigError extends Error {}


function parseConfigFile(): AppConfig {
	const configPath = join(process.cwd(), 'config.yml')
	logger.info(`Reading config from ${configPath}`)
	const config = parse(readFileSync(configPath).toString()) 

	try {
		configSchema.parse(config)
		logger.info('Config validated')
	} catch (err) {
		logger.error('Unable to parse config')
		if (err instanceof Error) {
			logger.error(err.message)
		} else {
			logger.error(err as string)
		}
		process.exit(1)
	}
	
	return config as AppConfig
}

// this is for a quick host, nothing too major right now
function getConfigFromParams(): AppConfig | null {
	const prog = new Command()

	// use the filename as the endpoint. If the filename is index.*, use the parent dir
	const opts = prog
		.option('-p, --path <path>', 'API route to host your lambda handler')
		.option('-f, --file <file>', 'File to load')
		.option('-e, --export <exports>', 'Exports to import and run. Defaults to `lambda_handler`')
		.parse(process.argv)
		.opts()

	if (isEmpty(opts)) return null

	logger.info('Using args for config')

	const path = opts.path || '/'
	const handler = opts.export || 'lambda_handler'

	if (!opts.file) {
		throw new ConfigError('File to import not passed')
	}
	
	return {
		port: 3000,
		lambdas: [{
			src: opts.file,
			name: 'local',
			endpoint: path,
			export: handler
		}]
	}
}


export const config = getConfigFromParams() || parseConfigFile()
console.log('oioio')
