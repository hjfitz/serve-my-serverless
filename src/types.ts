
type Path = `/${string}`

export interface LambdaMeta {
	src: string
	name: string
	endpoint: Path
	export: string
}

export interface AppConfig {
	port: number
	verbose: boolean
	lambdas: LambdaMeta[]
}

export interface LambdaResponse {
	statusCode: number
	body: string
}

export interface ParamConfig {
	path?: Path
	file?: string
	export?: string
	verbose?: boolean
}
