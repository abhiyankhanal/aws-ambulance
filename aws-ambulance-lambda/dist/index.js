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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_lambda_1 = require("@aws-sdk/client-lambda");
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { region, lambdaName } = event;
    const lambdaClient = new client_lambda_1.LambdaClient({
        region: region,
    });
    const sendEmailLambda = new client_lambda_1.Lambda({ region: region || "us-east-1" });
    const logs = [];
    try {
        // Update the execution role policy to deny all actions
        const rolePolicyParams = {
            FunctionName: lambdaName,
            StatementId: "DenyAllAccess",
            Action: "lambda:*",
            Principal: "*",
        };
        yield lambdaClient.send(new client_lambda_1.AddPermissionCommand(rolePolicyParams));
        logs.push({ Success: `Successfully updated permission of ${lambdaName}.` });
    }
    catch (error) {
        logs.push({ Error: `Error updating permission of ${lambdaName}:`, error });
    }
    try {
        // Remove triggers
        const listTriggersParams = {
            FunctionName: lambdaName,
        };
        const { EventSourceMappings } = yield lambdaClient.send(new client_lambda_1.ListEventSourceMappingsCommand(listTriggersParams));
        if (EventSourceMappings) {
            for (const trigger of EventSourceMappings) {
                if (trigger.UUID) {
                    const deleteTriggerParams = {
                        UUID: trigger.UUID,
                    };
                    yield lambdaClient.send(new client_lambda_1.DeleteEventSourceMappingCommand(deleteTriggerParams));
                    logs.push({ Success: `Deleted trigger with UUID ${trigger.UUID}` });
                }
            }
        }
    }
    catch (error) {
        logs.push({
            Error: `Error removing triggers from Lambda function ${lambdaName}:`,
            error,
        });
    }
    try {
        const updateEnvParams = {
            FunctionName: lambdaName,
            Environment: {
                Variables: {},
            },
        };
        yield lambdaClient.send(new client_lambda_1.UpdateFunctionConfigurationCommand(updateEnvParams));
        logs.push({
            Success: `Successfully updated environment of Lambda function ${lambdaName}`,
        });
    }
    catch (error) {
        logs.push({ Error: `Error updating environment of ${lambdaName} lambda` });
    }
    yield sendEmailLambda.invoke({
        FunctionName: (_a = process.env) === null || _a === void 0 ? void 0 : _a.SendEmailLambda,
        Payload: JSON.stringify({ logs, sendEmail: true }),
    });
});
exports.handler = handler;
