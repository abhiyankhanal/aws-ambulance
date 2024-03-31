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
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const { region, bucketName } = event;
    console.log('Event here', event.bucketName);
    if (!region || !bucketName) {
        return {
            statusCode: 400,
            body: "Missing region or bucketName in the event payload",
        };
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
        // Update CORS Configuration to Deny All
        const corsParams = {
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: [],
                        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        AllowedOrigins: ["*"],
                        ExposeHeaders: [],
                    },
                ],
            },
        };
        yield s3.putBucketCors(corsParams);
        console.log(`Updated policy and CORS configuration for bucket ${bucketName}`);
        return {
            statusCode: 200,
            body: "Bucket policy and CORS updated successfully",
        };
    }
    catch (error) {
        console.error(`Error updating bucket ${bucketName}:`, error);
        return {
            statusCode: 500,
            body: "Error updating bucket policy and CORS: " + error,
        };
    }
});
