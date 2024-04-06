import { S3 } from "@aws-sdk/client-s3";

exports.handler = async (event: { region: string, bucketName: string }) => {
  const { region, bucketName } = event;

  const logs = [];

  if (!region || !bucketName) {
    logs.push({ "Error": `Missing region or bucketName in the event payload while running the operations for s3` });
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
    logs.push({ "Error": `Failed to update policy params for ${bucketName}`, error });
  }

    // Update CORS Configuration to Deny All

    try {
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: [],
            AllowedMethods: [],
            AllowedOrigins: [],
            ExposeHeaders: [],
          },
        ],
      },
    };
    await s3.putBucketCors(corsParams); 

    logs.push({ "Success": `Bucket CORS policy updated successfully for ${bucketName}` });
  } catch (error) {
    logs.push({ "Error": `Failed to update CORS policy for ${bucketName}`, error });
  }
};
