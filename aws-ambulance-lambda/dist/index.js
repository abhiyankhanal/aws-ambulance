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
const client_lambda_1 = require("@aws-sdk/client-lambda");
const aws_sdk_1 = require("aws-sdk");
const readline = require("readline");
const IO = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const askQuestion = (question) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => IO.question(question, (answer) => resolve(answer.trim())));
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield askQuestion("Enter AWS profile name, press enter if default: ");
    const region = yield askQuestion("Enter AWS region, eg: us-east-1: ");
    const functionName = yield askQuestion("Enter the Lambda function name: ");
    const lambda = new client_lambda_1.Lambda({
        credentials: new aws_sdk_1.SharedIniFileCredentials({ profile }),
        region,
    });
    try {
        // Update the execution role policy to deny all actions
        const rolePolicyParams = {
            FunctionName: functionName,
            StatementId: "DenyAllAccess",
            Action: "lambda:*",
            Principal: "*",
        };
        yield lambda.addPermission(rolePolicyParams);
    }
    catch (error) {
        console.error(`Error updating permission of ${functionName}:`, error);
    }
    try {
        // Remove triggers
        const listTriggersParams = {
            FunctionName: functionName,
        };
        const triggers = yield lambda.listEventSourceMappings(listTriggersParams);
        if (triggers.EventSourceMappings) {
            for (const trigger of triggers.EventSourceMappings) {
                if (trigger.UUID) {
                    const deleteTriggerParams = {
                        UUID: trigger.UUID,
                    };
                    yield lambda.deleteEventSourceMapping(deleteTriggerParams);
                    console.log(`Deleted trigger with UUID ${trigger.UUID}`);
                }
            }
        }
        console.log(`Successfully removed all triggers from Lambda function ${functionName}.`);
    }
    catch (error) {
        console.error(`Error removing triggers from Lambda function ${functionName}:`, error);
    }
    try {
        // Modify or remove sensitive information stored as environment variables
        const updateEnvParams = {
            FunctionName: functionName,
            Environment: {
                Variables: {},
            },
        };
        yield lambda.updateFunctionConfiguration(updateEnvParams);
        console.log(`Successfully denied all access to Lambda function ${functionName}.`);
    }
    catch (error) {
        console.error(`Error updating env of ${functionName} lambda`, error);
    }
});
// Execute main
main();
