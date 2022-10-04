import pino from 'pino'
import expressLogger from 'express-pino-logger'

export const logger = pino({
	transport: {
	   target: 'pino-pretty',
	}
})

export const loggerMiddleware = expressLogger({logger})
