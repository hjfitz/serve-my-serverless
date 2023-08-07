import {EventType} from './lambda'


export interface LambdaMeta {
	src: string
	name: string
	endpoint: string 
	export: string
	eventType: EventType
}

export interface AppConfig {
	port: number
	verbose?: boolean
	lambdas: LambdaMeta[]
}

export interface LambdaResponse {
	statusCode: number
	body: string
}

export interface ParamConfig {
	port?: string 
	route?: string
	file?: string
	export?: string
	verbose?: boolean
	type?: string
	init?: string
}
