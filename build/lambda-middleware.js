"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLambdas = exports.lambdaHandler = void 0;
const path_1 = require("path");
const logger_1 = require("./logger");
function lambdaHandler(lambda, meta) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const cb = (err, result) => {
                if (err) {
                    if (err instanceof Error) {
                        res.status(500).send(err.message);
                    }
                    else {
                        res.status(500).send(err);
                    }
                }
                else {
                    const { statusCode, body } = result !== null && result !== void 0 ? result : { statusCode: 200, body: 'ok' };
                    res.status(statusCode).send(body);
                }
            };
            // @ts-expect-error not all fields present
            const context = {
                functionName: meta.name,
                invokedFunctionArn: 'local',
                callbackWaitsForEmptyEventLoop: false,
                awsRequestId: 'local',
            };
            try {
                const { statusCode, body } = yield lambda(req, context, cb);
                res.status(statusCode).send(body);
            }
            catch (err) {
                if (err instanceof Error) {
                    res.status(500).send(`Error: ${err.message}`);
                }
                else {
                    res.status(500).send(err);
                }
            }
        });
    };
}
exports.lambdaHandler = lambdaHandler;
function resolveLambdas(expressApp, lambdas) {
    return lambdas.map((lambdaMeta) => __awaiter(this, void 0, void 0, function* () {
        try {
            const importPath = (0, path_1.join)(process.cwd(), lambdaMeta.src);
            const file = yield Promise.resolve().then(() => __importStar(require(importPath)));
            expressApp.all(lambdaMeta.endpoint, lambdaHandler(file[lambdaMeta.export], lambdaMeta));
        }
        catch (e) {
            logger_1.logger.warn(lambdaMeta, 'Unable to configure lambda');
            if (e instanceof Error) {
                logger_1.logger.warn('error:');
                logger_1.logger.warn(e.message);
            }
        }
    }));
}
exports.resolveLambdas = resolveLambdas;