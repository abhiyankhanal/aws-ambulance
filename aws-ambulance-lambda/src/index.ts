import { LambdaClient, AddPermissionCommand, DeleteEventSourceMappingCommand, ListEventSourceMappingsCommand, UpdateFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";


export const handler = async (event: {region:string, lambdaName: string }, action?: 'unlock') => {
  const { region, lambdaName } = event;

  const lambdaClient = new LambdaClient({
    region: region,
  });
  
  const s3Client = new S3Client({ region: lambdaClient.config.region });

  const logs = [];

  // Helper function to update permission to deny all actions
  const updatePermission = async () => {
    try {
      const rolePolicyParams = {
        FunctionName: lambdaName,
        StatementId: "DenyAllAccess",
        Action: "lambda:*",
        Principal: "*",
      };
      await lambdaClient.send(new AddPermissionCommand(rolePolicyParams));
      logs.push({ "Success": `Successfully updated permission of ${lambdaName}.`});
    } catch (error) {
      logs.push({ "Error": `Error updating permission of ${lambdaName}:`, error});
    }
  };

  // Helper function to remove triggers
  const removeTriggers = async () => {
    try {
      const listTriggersParams = {
        FunctionName: lambdaName,
      };
      const { EventSourceMappings } = await lambdaClient.send(new ListEventSourceMappingsCommand(listTriggersParams));
      
      if (EventSourceMappings) {
        for (const trigger of EventSourceMappings) {
          if (trigger.UUID) {
            const deleteTriggerParams = {
              UUID: trigger.UUID,
            };
            await lambdaClient.send(new DeleteEventSourceMappingCommand(deleteTriggerParams));
            logs.push({ "Success": `Deleted trigger with UUID ${trigger.UUID}`});
          }
        }
      }
    } catch (error) {
      logs.push({ "Error": `Error removing triggers from Lambda function ${lambdaName}:`, error});
    }
  };

  // Helper function to update environment
  const updateEnvironment = async () => {
    try {
      const updateEnvParams = {
        FunctionName: lambdaName,
        Environment: {
          Variables: {},
        },
      };
      await lambdaClient.send(new UpdateFunctionConfigurationCommand(updateEnvParams));
      logs.push({ "Success": `Successfully updated environment of Lambda function ${lambdaName}`});
    } catch (error) {
      logs.push({ "Error": `Error updating environment of ${lambdaName} lambda`});
    }
  };

  // Helper function to save current state to S3
  const saveStateToS3 = async () => {
    try {
      const currentState = {
        permissionParams: {
          FunctionName: lambdaName,
          StatementId: "DenyAllAccess",
          Action: "lambda:*",
          Principal: "*",
        },
        triggers: await getTriggers(lambdaName),
        environmentParams: {
          FunctionName: lambdaName,
          Environment: {
            Variables: {},
          },
        },
      };

      const putObjectParams = {
        Bucket: "YOUR_S3_BUCKET_NAME",
        Key: `${lambdaName}_lock_state.json`,
        Body: JSON.stringify(currentState),
      };
      await s3Client.send(new PutObjectCommand(putObjectParams));

      logs.push({ "Success": `Successfully saved current state of Lambda function ${lambdaName} to S3`});
    } catch (error) {
      logs.push({ "Error": `Error saving current state to S3 for Lambda function ${lambdaName}:`, error});
    }
  };

  // Helper function to retrieve triggers
  const getTriggers = async (lambdaName: string) => {
    try {
      const listTriggersParams = {
        FunctionName: lambdaName,
      };
      const { EventSourceMappings } = await lambdaClient.send(new ListEventSourceMappingsCommand(listTriggersParams));
      return EventSourceMappings || [];
    } catch (error) {
      logs.push({ "Error": `Error retrieving triggers for Lambda function ${lambdaName}:`, error});
      return [];
    }
  };

  // Helper function to retrieve state from S3
  const getStateFromS3 = async () => {
    try {
      const getObjectParams = {
        Bucket: "YOUR_S3_BUCKET_NAME",
        Key: `${lambdaName}_lock_state.json`,
      };
      const data = await s3Client.send(new GetObjectCommand(getObjectParams));
      return JSON.parse(data?.Body?.toString() || '');
    } catch (error) {
      logs.push({ "Error": `Error getting lock state for Lambda function ${lambdaName} from S3:`, error});
      return null;
    }
  };

  if (!action) {
    // Locking Logicconst lambdaClient = new LambdaClient();

    await saveStateToS3();
    await updatePermission();
    await removeTriggers();
    await updateEnvironment();
  } else if (action === 'unlock') {
    // Unlocking Logic
    // Retrieve previous state
    try {
      const previousState = await getStateFromS3();
      if (previousState) {
        // Restore previous state
        await lambdaClient.send(new AddPermissionCommand(previousState.permissionParams));
        for (const trigger of previousState.triggers) {
          await lambdaClient.send(new DeleteEventSourceMappingCommand({ UUID: trigger.UUID }));
        }
        await lambdaClient.send(new UpdateFunctionConfigurationCommand(previousState.environmentParams));
        logs.push({ "Success": `Successfully unlocked Lambda function ${lambdaName}`});
      } else {
        logs.push({ "Error": `No previous state found for Lambda function ${lambdaName}`});
      }
    } catch (error) {
      logs.push({ "Error": `Error unlocking Lambda function ${lambdaName}:`, error});
    }
  } else {
    logs.push({ "Error": `Invalid action specified: ${action}`});
  }

  // Log the results
  console.log(logs);

  return logs;
};
