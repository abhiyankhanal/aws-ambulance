import { AddPermissionRequest, DeleteEventSourceMappingRequest, Lambda } from "@aws-sdk/client-lambda";
import { SharedIniFileCredentials } from "aws-sdk";

import * as readline from "readline";

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
  const functionName = await askQuestion("Enter the Lambda function name: ");

  const lambda = new Lambda({
    credentials: new SharedIniFileCredentials({ profile }),
    region,
  });

  try {
      // Update the execution role policy to deny all actions
      const rolePolicyParams: AddPermissionRequest = {
        FunctionName: functionName,
        StatementId: "DenyAllAccess",
        Action: "lambda:*",
        Principal: "*",
      };
      await lambda.addPermission(rolePolicyParams);

  } catch (error) {
    console.error(`Error updating permission of ${functionName}:`, error);
  }


  try {
    // Remove triggers
    const listTriggersParams = {
      FunctionName: functionName,
    };
    const triggers = await lambda.listEventSourceMappings(listTriggersParams);
    if (triggers.EventSourceMappings){
    for (const trigger of triggers.EventSourceMappings) {
      if (trigger.UUID) {
        const deleteTriggerParams: DeleteEventSourceMappingRequest = {
          UUID: trigger.UUID,
        };
        await lambda.deleteEventSourceMapping(deleteTriggerParams);
        console.log(`Deleted trigger with UUID ${trigger.UUID}`);
      }
    }
  }

    console.log(`Successfully removed all triggers from Lambda function ${functionName}.`);
  } catch (error) {
    console.error(`Error removing triggers from Lambda function ${functionName}:`, error);
  }

  try{  
  // Modify or remove sensitive information stored as environment variables
    const updateEnvParams = {
      FunctionName: functionName,
      Environment: {
        Variables: {},
      },
    };
    await lambda.updateFunctionConfiguration(updateEnvParams);

    console.log(`Successfully denied all access to Lambda function ${functionName}.`);
  } catch (error) {
    console.error(`Error updating env of ${functionName} lambda`, error);
  }
};

// Execute main
main();
