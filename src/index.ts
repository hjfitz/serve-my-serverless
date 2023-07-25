#!/usr/bin/env node

import chokidar from 'chokidar'
import {ConfigService} from './config'
import {HotReloadServer} from './server'
import {debounce} from './utils'

async function main(): Promise<void> {
	const configService = new ConfigService()
	const server = new HotReloadServer(configService)
	const watcher = chokidar.watch(process.cwd())
	const reloadFn = debounce(() => server.respawn())
	watcher.on('all', reloadFn)
}

void main()
