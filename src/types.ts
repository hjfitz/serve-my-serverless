

export interface LambdaMeta {
	src: string
	name: string
	endpoint: string 
	export: string
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
	path?: string 
	file?: string
	export?: string
	verbose?: boolean
}
