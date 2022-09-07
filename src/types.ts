
// todo: rename
export interface LambdaMeta {
	src: string
	name: string
	endpoint: `/${string}`
	export: string
}

export interface AppConfig {
	port: number
	lambdas: LambdaMeta[]
}

export interface LambdaResponse {
	statusCode: number
	body: string
}

