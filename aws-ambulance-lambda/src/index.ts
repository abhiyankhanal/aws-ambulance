import { AddPermissionCommand, DeleteEventSourceMappingCommand, LambdaClient, ListEventSourceMappingsCommand, UpdateFunctionConfigurationCommand } from "@aws-sdk/client-lambda";

export const handler = async (event: { region: string, lambdaName: string }) => {
  const { region, lambdaName } = event;
  const lambdaClient = new LambdaClient({
    region: region,
  });

  const logs = [];

  try {
    // Update the execution role policy to deny all actions
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
          logs.push({ "Success": `Deleted trigger with UUID ${trigger.UUID}`});
        }
      }
    }

  } catch (error) {
    logs.push({ "Error": `Error removing triggers from Lambda function ${lambdaName}:`, error});
  }

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
