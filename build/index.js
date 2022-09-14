#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_terminator_1 = require("http-terminator");
const http_1 = require("http");
const chokidar_1 = __importDefault(require("chokidar"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./logger");
const lambda_middleware_1 = require("./lambda-middleware");
const config_1 = __importDefault(require("./config"));
function spawnServer(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        app.use(logger_1.appLogger);
        yield Promise.all((0, lambda_middleware_1.resolveLambdas)(app, config.lambdas));
        const server = (0, http_1.createServer)(app);
        return server;
    });
}
function startServer(server, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield new Promise(res => server.listen(config.port, () => res(null)));
            logger_1.logger.info(`App listening at http://localhost:${config.port}`);
            config.lambdas.forEach(lambdaMeta => logger_1.logger.info(`Mounted endpoint: "${lambdaMeta.name}" => http://localhost:${config.port}${lambdaMeta.endpoint}`));
        }
        catch (err) {
            logger_1.logger.debug('Unable to spawn server, trying again');
            setTimeout(() => startServer(server, config), 100);
        }
    });
}
function createWatcher(server, config) {
    return __awaiter(this, void 0, void 0, function* () {
        // we could get clever and pass a root dir as an arg
        const root = process.cwd();
        const watcher = chokidar_1.default.watch(root);
        let terminator = (0, http_terminator_1.createHttpTerminator)({ server });
        setTimeout(() => {
            logger_1.logger.info(`Started watching ${root}`);
            watcher.on('all', () => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.info('New changes found. Killing server');
                yield terminator.terminate();
                // this spawn and save config probably needs abstracting to a new class
                const newServer = yield spawnServer(config);
                logger_1.logger.info('Spawning new server');
                yield startServer(newServer, config);
                terminator = (0, http_terminator_1.createHttpTerminator)({ server: newServer });
            }));
        }, 500);
    });
}
// todo: arg parsing
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv_1.default.config();
        const server = yield spawnServer(config_1.default);
        yield startServer(server, config_1.default);
        yield createWatcher(server, config_1.default);
    });
}
void main();
