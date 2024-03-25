require("aws-sdk/lib/maintenance_mode_message").suppress = true;

import * as readline from "readline";
import * as AWS from "aws-sdk";
import { S3 } from "@aws-sdk/client-s3";

const IO = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = async (question: string): Promise<string> => {
  return new Promise((resolve) =>
    IO.question(question, (answer) => resolve(answer.trim()))
  );
};

const main = async () => {
  const profile = await askQuestion(
    "Enter AWS profile name, press enter if default: "
  );
  const region = await askQuestion("Enter AWS region, eg: us-east-1: ");
  const bucketName = await askQuestion("Enter the bucket name: ");

  let s3;

  try {
    s3 = new S3({
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
    await s3.putBucketPolicy(policyParams);

    // Update CORS Configuration to Deny All
    const corsParams = {
      Bucket: bucketName, // Bucket name, not ARN
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
    await s3.putBucketCors(corsParams);

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

    console.log(
      `Updated policy, acl and CORS configuration for bucket ${bucketName}`
    );
  } catch (error) {
    console.error(`Error updating bucket ${bucketName}:`, error);
  }
};

//Execute main
main();
