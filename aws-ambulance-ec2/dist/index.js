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
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const readline = require("readline");
const AWS = require("aws-sdk");
const aws_sdk_1 = require("aws-sdk");
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
    const bucketName = yield askQuestion("Enter the bucket name: ");
    let s3;
    try {
        s3 = new aws_sdk_1.S3({
            credentials: new AWS.SharedIniFileCredentials({ profile }),
            region,
        });
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
        s3.putBucketPolicy(policyParams).promise();
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
        s3.putBucketCors(corsParams).promise();
        // Update ACL to deny all
        // const aclParams = {
        //   Bucket: bucketName, // Bucket name, not ARN
        //   AccessControlPolicy: {
        //     Grants: [
        //       {
        //         Grantee: {
        //           Type: 'Group',
        //           URI: 'http://acs.amazonaws.com/groups/global/AllUsers'
        //         },
        //         Permission: 'READ'
        //       }
        //     ]
        //   }
        // };
        // await s3.putBucketAcl(aclParams);
        console.log(`Updated policy, acl and CORS configuration for bucket ${bucketName}`);
    }
    catch (error) {
        console.error(`Error updating bucket ${bucketName}:`, error);
    }
});
//Execute main
main();
