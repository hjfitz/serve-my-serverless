"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const yaml_1 = require("yaml");
const fs_1 = require("fs");
const path_1 = require("path");
const ramda_1 = require("ramda");
const logger_1 = require("./logger");
const zod_1 = require("zod");
const configSchema = zod_1.z.object({
    port: zod_1.z.number(),
    lambdas: zod_1.z.optional(zod_1.z.array(zod_1.z.object({
        src: zod_1.z.string(),
        name: zod_1.z.string(),
        endpoint: zod_1.z.string().startsWith('/'),
        export: zod_1.z.string(),
    })))
});
class ConfigError extends Error {
}
function parseConfigFile() {
    const configPath = (0, path_1.join)(process.cwd(), 'config.yml');
    logger_1.logger.info(`Reading config from ${configPath}`);
    const config = (0, yaml_1.parse)((0, fs_1.readFileSync)(configPath).toString());
    try {
        configSchema.parse(config);
        logger_1.logger.info('Config validated');
    }
    catch (err) {
        logger_1.logger.error('Unable to parse config');
        if (err instanceof Error) {
            logger_1.logger.error(err.message);
        }
        else {
            logger_1.logger.error(err);
        }
        process.exit(1);
    }
    return config;
}
// this is for a quick host, nothing too major right now
function getConfigFromParams() {
    const prog = new commander_1.Command();
    // use the filename as the endpoint. If the filename is index.*, use the parent dir
    const opts = prog
        .option('-p, --path <path>', 'Path to host your lambda handler ')
        .option('-f, --file <file>', 'File to load')
        .option('-e, --export <exports>', 'Exports to import and run. Defaults to `lambda_handler`')
        .parse()
        .opts();
    if ((0, ramda_1.isEmpty)(opts))
        return null;
    logger_1.logger.info('Using args for config');
    const path = opts.path || '/';
    const handler = opts.export || 'lambda_handler';
    if (!opts.file) {
        throw new ConfigError('File to import not passed');
    }
    return {
        port: 3000,
        lambdas: [{
                src: opts.file,
                name: 'local',
                endpoint: path,
                export: handler
            }]
    };
}
const config = getConfigFromParams() || parseConfigFile();
exports.default = config;
