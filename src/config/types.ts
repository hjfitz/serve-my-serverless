import {AppConfig} from '../types'

export abstract class IConfigService {
	protected abstract loadEnv(verbose: boolean): void;
	protected abstract loadFromFile(): AppConfig | null;
	protected abstract loadFromArgs(): AppConfig | null;
	protected abstract getConfig(): AppConfig;
	abstract refreshConfig(): void;
}
