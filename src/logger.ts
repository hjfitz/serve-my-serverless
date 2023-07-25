import pino from 'pino'
import expressLogger from 'express-pino-logger'


const logLevel = process.env.LOG_LEVEL ?? 'info'
export const logger = pino({
	transport: {
		target: 'pino-pretty'
	},
	level: logLevel
})
logger.info(`logger initialised with level: ${logLevel}`)

export const loggerMiddleware = expressLogger({logger})
