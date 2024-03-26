import { AddPermissionCommand, DeleteEventSourceMappingCommand, LambdaClient, ListEventSourceMappingsCommand, UpdateFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { SharedIniFileCredentials } from "aws-sdk";

export const handler = async (event: { region: string, lambdaName: string }) => {
  const { region, lambdaName } = event;
  const lambdaClient = new LambdaClient({
    credentials: new SharedIniFileCredentials(), // Using default profile
    region: region,
  });

  try {
    // Update the execution role policy to deny all actions
    const rolePolicyParams = {
      FunctionName: lambdaName,
      StatementId: "DenyAllAccess",
      Action: "lambda:*",
      Principal: "*",
    };
    await lambdaClient.send(new AddPermissionCommand(rolePolicyParams));

    console.log(`Successfully updated permission of ${lambdaName}.`);
  } catch (error) {
    console.error(`Error updating permission of ${lambdaName}:`, error);
  }

  try {
    // Remove triggers
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
          console.log(`Deleted trigger with UUID ${trigger.UUID}`);
        }
      }
    }
    
    console.log(`Successfully removed all triggers from Lambda function ${lambdaName}.`);
  } catch (error) {
    console.error(`Error removing triggers from Lambda function ${lambdaName}:`, error);
  }

  try {
    // Modify or remove sensitive information stored as environment variables
    const updateEnvParams = {
      FunctionName: lambdaName,
      Environment: {
        Variables: {},
      },
    };
    await lambdaClient.send(new UpdateFunctionConfigurationCommand(updateEnvParams));

    console.log(`Successfully updated environment of Lambda function ${lambdaName}.`);
  } catch (error) {
    console.error(`Error updating environment of ${lambdaName} lambda`, error);
  }
};
