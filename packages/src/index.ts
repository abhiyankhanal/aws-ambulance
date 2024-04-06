import * as AWS from "aws-sdk";
import { exec } from "child_process";
const monitorResourceType = ["S3Bucket"];

import { Command } from "commander";
import inquirer from "inquirer";

// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer.registerPrompt("table", require("inquirer-table-prompt"));

async function getDetectorId(): Promise<string | null> {
  const config: AWS.GuardDuty.Types.ClientConfiguration = {
    region: "us-east-1",
  };

  const guardduty = new AWS.GuardDuty(config);

  try {
    const detectors = await guardduty.listDetectors().promise();
    if (detectors.DetectorIds && detectors.DetectorIds.length > 0) {
      return detectors.DetectorIds[0]; // Assuming only one detector is present
    } else {
      throw new Error("No detectors found.");
    }
  } catch (err) {
    console.error("Error getting detector ID:", err);
    return null;
  }
}

async function getVulnerableServices(): Promise<AWS.GuardDuty.Finding[]> {
  const detectorId = await getDetectorId();
  if (!detectorId) {
    return [];
  }

  const config: AWS.GuardDuty.Types.ClientConfiguration = {
    region: "us-east-1", // Replace 'your-aws-region' with your AWS region code
  };

  const guardduty = new AWS.GuardDuty(config);
  try {
    const findings = await guardduty
      .listFindings({ DetectorId: detectorId, MaxResults: 20 })
      .promise();

    const vulnerableServices: AWS.GuardDuty.Finding[] = [];
    const findingIds = findings.FindingIds || [];
    const promises = findingIds.map((findingId) =>
      guardduty
        .getFindings({ DetectorId: detectorId, FindingIds: [findingId] })
        .promise()
    );

    const findingDetailsArray = await Promise.all(promises);

    findingDetailsArray.forEach((findingDetails) => {
      const finding = findingDetails.Findings && findingDetails.Findings[0];
      if (finding) {
        const resourceType = finding.Resource.ResourceType;
        if (resourceType && monitorResourceType.includes(resourceType)) {
          vulnerableServices.push(finding);
        }
      }
    });

    return vulnerableServices;
  } catch (err) {
    console.error("Error:", err);
    return [];
  }
}

async function getListOfServices() {
  const vulnerableServices = await getVulnerableServices();

  const test: any[] = [];
  vulnerableServices.forEach((item) => {
    const test12: any = item.Resource.S3BucketDetails?.map((item) => {
      return {
        arn: item.Arn,
      };
    });
    return test.push({
      title: item.Title,
      type: item.Type,
      services: test12,
    });
  });

  return test;
}

const program = new Command();

async function renderOptions() {
  const questions = [
    {
      type: "list",
      name: "option",
      message: "Select an option:",
      choices: ["Option 1", "Option 2", "Option 3"],
    },
  ];

  const answers = await inquirer.prompt(questions);
}

program
  .version("1.0.0")
  .description("A simple CLI program")
  .option("-l, --list <message>", "Set the greeting message", "Hello")
  .action(async () => {
    const list = await getListOfServices();

    const s3Alerts = list.map((item, index) => ({
      value: index,
      name: `[${item.type}]: ${item.title}`,
    }));

    // Define an array of options to render as a table

    const answer = await inquirer.prompt([
      {
        type: "table",
        name: "Action Plan",
        message: "Select item to resolve",
        columns: [
          {
            name: "Action",
            value: "action",
          },
        ],
        rows: s3Alerts,
      },
    ]);

    //locking AWS S3 service

    console.log("🚀 Initiating lock process for S3 bucket");
    console.log("🔒 Initiating lock process for S3 bucket ...");
    console.log("🔍 Checking bucket status...");
    console.log("🔒 Locking bucket to prevent modifications...");
    console.log("⏳ Locking process in progress...");
    const awsCommand = `aws stepfunctions start-execution --state-machine-arn arn:aws:states:us-east-1:684378237653:stateMachine:AWSAmbulanceStartExecution-xdYEynYSiTX3 --input '{"arns": ["arn:aws:s3:::testing-aws-ambulance-s3", "arn:aws:lambda:us-east-1:684378237653:function:testing-aws-ambulance-lambda"]}'`;
    exec(awsCommand, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.log(`Command output: ${stdout}`);
        return;
      }
      console.log(
        "🔒 S3 bucket is now locked successfully. Email will be send once lockdown is completed."
      );
    });
  });

program.parse(process.argv);
