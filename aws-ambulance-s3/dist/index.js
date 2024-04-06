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
const client_s3_1 = require("@aws-sdk/client-s3");
const client_lambda_1 = require("@aws-sdk/client-lambda");
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { region, bucketName } = event;
    const logs = [];
    const lambda = new client_lambda_1.Lambda({ region: region || "us-east-1" });
    if (!region || !bucketName) {
        logs.push({
            Error: `Missing region or bucketName in the event payload while running the operations for s3`,
        });
    }
    const s3 = new client_s3_1.S3({ region });
    try {
        // Update Bucket Policy to Deny All
        const policyParams = {
            Bucket: bucketName,
            Policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Deny",
                        Principal: "*",
                        Action: "*",
                        Resource: `arn:aws:s3:::${bucketName}/*`,
                    },
                ],
            }),
        };
        yield s3.putBucketPolicy(policyParams);
    }
    catch (error) {
        logs.push({
            Error: `Failed to update policy params for ${bucketName}`,
            error,
        });
    }
    // Update CORS Configuration to Deny All
    try {
        yield s3.deleteBucketCors({ Bucket: bucketName });
        logs.push({
            Success: `Bucket CORS policy updated successfully for ${bucketName}`,
        });
    }
    catch (error) {
        logs.push({
            Error: `Failed to update CORS policy for ${bucketName}`,
            error,
        });
    }
    yield lambda.invoke({
        FunctionName: (_a = process.env) === null || _a === void 0 ? void 0 : _a.SendEmailLambda,
        Payload: JSON.stringify({ logs, sendEmail: true }),
    });
});
