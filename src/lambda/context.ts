import {Context} from 'aws-lambda'

export function createContext(name: string): Context {
	// @ts-expect-error not all fields present
	const context: Context = {
		functionName: name,
		invokedFunctionArn: 'local',
		callbackWaitsForEmptyEventLoop: false,
		awsRequestId: 'local'
	}

	return context
}
