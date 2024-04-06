import { S3 } from "@aws-sdk/client-s3";
import { getLastS3PolicyFromState, updateS3Policy } from "./utils";

exports.handler = async (event: {
  region: string;
  bucketName: string;
  actionType: "lock" | "unlock";
}) => {
  const { region, bucketName } = event;

  const logs = [];

  if (!region || !bucketName) {
    logs.push({
      Error: `Missing region or bucketName in the event payload while running the operations for s3`,
    });
  }

  const s3 = new S3({ region });

  if (!event.actionType || event.actionType === "lock") {
    console.log("lock: update S3 policy");
    await updateS3Policy(
      s3,
      bucketName,
      {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyPublicAccess",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `arn:aws:s3:::${bucketName}/*`,
            Condition: {
              Bool: {
                "aws:SecureTransport": "false",
              },
            },
          },
        ],
      },
      "lock"
    );
  } else {
    const getLastConfig = getLastS3PolicyFromState(s3);
    if (getLastConfig) {
      await updateS3Policy(s3, bucketName, getLastConfig, "unlock");
    } else {
      throw new Error("Last S3 config not found.");
    }
  }

  try {
    return {
      statusCode: 200,
      body: "Bucket policy successfully",
    };
  } catch (error) {
    console.error(`Error updating bucket ${bucketName}:`, error);
    return {
      statusCode: 500,
      body: "Error updating bucket policy: " + error,
    };
  }
};
