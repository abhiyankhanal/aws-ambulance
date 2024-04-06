import { S3 } from "@aws-sdk/client-s3";

const S3_BUCKET_STATE = "ambulance-state";
const fileKey = "state.json";

export const getCurrentBucketPolicy = async (s3: S3, bucketName: any) => {
  const params = {
    Bucket: bucketName,
  };

  try {
    const data = await s3.getBucketPolicy(params);
    return JSON.parse(data.Policy!);
  } catch (error) {
    console.error(
      `Error getting current access policy for bucket '${bucketName}':`,
      error
    );
    return {};
  }
};
export const getLastS3PolicyFromState = async (s3: S3) => {
  const params: any = {
    Bucket: S3_BUCKET_STATE,
    Key: fileKey,
  };

  try {
    const data = await s3.getObject(params);
    return JSON.parse(data.Body!.toString());
  } catch (error) {
    console.error(
      `Error getting previous access policy for bucket '${S3_BUCKET_STATE}':`,
      error
    );
    return {};
  }
};
export const saveCurrentPolicyToS3 = async (s3: S3, bucketName: string) => {
  const putPolicyParams = {
    Bucket: S3_BUCKET_STATE,
    Key: fileKey,
    Body: JSON.stringify(await getCurrentBucketPolicy(s3, bucketName)),
  };

  await s3.putObject(putPolicyParams);
};
export const updateS3Policy = async (
  s3: S3,
  bucketName: any,
  policy: any,
  actionType: "lock" | "unlock"
) => {
  try {
    if (actionType === "lock") {
      await saveCurrentPolicyToS3(s3, bucketName);
    }

    const putParams = {
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    };

    await s3.putBucketPolicy(putParams);
    console.log(`Access to bucket '${bucketName}' is locked down.`);
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
