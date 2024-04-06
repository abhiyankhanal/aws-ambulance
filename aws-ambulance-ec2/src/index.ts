import { S3 } from "@aws-sdk/client-s3";

exports.handler = async (event: { region: string; bucketName: string }) => {
  const { region, bucketName } = event;

  const logs = [];

  if (!region || !bucketName) {
    logs.push({ "Error": "Missing region or bucketName in the event payload" });
  }

  const s3 = new S3({ region });

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
    await s3.putBucketPolicy(policyParams);

  } catch(error) {
    logs.push({ "Error": "Failed to update policy params", error });
  }

    // Update CORS Configuration to Deny All

    try {
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
    await s3.putBucketCors(corsParams); 

    console.log(
      `Updated policy and CORS configuration for bucket ${bucketName}`
    );

    return {
      statusCode: 200,
      body: "Bucket policy and CORS updated successfully",
    };
  } catch (error) {
    console.error(`Error updating bucket ${bucketName}:`, error);
    return {
      statusCode: 500,
      body: "Error updating bucket policy and CORS: " + error,
    };
  }
};
