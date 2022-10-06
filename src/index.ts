#!/usr/bin/env node

import {config, loadAndLogEnv} from './config'
import chokidar from 'chokidar'
import {HotReloadServer} from './server'
import {debounce} from './utils'

async function main(): Promise<void> {
	loadAndLogEnv(config)
	const server = new HotReloadServer(config)
	const watcher = chokidar.watch(process.cwd())
	const reloadFn = debounce(() => server.respawn())
	watcher.on('all', reloadFn)
}

void main()
