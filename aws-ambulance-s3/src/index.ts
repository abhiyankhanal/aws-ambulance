import { S3 } from "@aws-sdk/client-s3";
import {
  getCurrentBucketPolicy,
  getLastS3PolicyFromState,
  saveCurrentPolicyToS3,
  updateS3Policy,
} from "./utils";

exports.handler = async (event: {
  region: string;
  bucketName: string;
  actionType: "lock" | "unlock";
}) => {
  const { region, bucketName } = event;

  if (!region || !bucketName) {
    return {
      statusCode: 400,
      body: "Missing region or bucketName in the event payload",
    };
  }

  const s3 = new S3({ region });

  if (event.actionType === "lock") {
    await updateS3Policy(
      s3,
      bucketName,
      {
        Effect: "Deny",
        Principal: "*",
        Action: "*",
        Resource: `arn:aws:s3:::${bucketName}/*`,
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
