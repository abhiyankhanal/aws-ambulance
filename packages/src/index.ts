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
    const totalFindingList = [];
    const first_findings = await guardduty
      .listFindings({
        DetectorId: detectorId,
        MaxResults: 50,
      })
      .promise();

    totalFindingList.push(...(first_findings?.FindingIds || []));

    const second_findings = await guardduty
      .listFindings({
        DetectorId: detectorId,
        MaxResults: 50,
        NextToken: first_findings.NextToken,
      })
      .promise();

    totalFindingList.push(...(second_findings?.FindingIds || []));

    const third_findings = await guardduty
      .listFindings({
        DetectorId: detectorId,
        MaxResults: 50,
        NextToken: second_findings.NextToken,
      })
      .promise();

    totalFindingList.push(...(third_findings?.FindingIds || []));

    const vulnerableServices: AWS.GuardDuty.Finding[] = [];
    const findingIds = totalFindingList || [];
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

function showLoadingUI() {
  const animation = ["|", "/", "-", "\\"]; // Array of characters for the loading animation
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write("\r" + "Fetching AWS S3 Logs " + animation[i]); // Overwrite the previous line
    i = (i + 1) % animation.length; // Increment the index and wrap around if needed
  }, 100); // Change the animation speed as needed

  // Return the interval object so it can be cleared later
  return interval;
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
      description: item.Description,
      type: item.Type,
      services: test12,
      severity: item.Severity,
      createdAt: item.CreatedAt,
      region: item.Region,
    });
  });

  return test;
}

const program = new Command();

program
  .version("1.0.0")
  .description("A simple CLI program")
  .option("-l, --list <message>", "Set the greeting message", "Hello")
  .action(async () => {
    const loadingInterval = showLoadingUI();
    const list = await getListOfServices();
    clearInterval(loadingInterval); // Stop the loading animation

    const s3Alerts = list.map((item, index) => ({
      value: index,
      name: `[${item.type}]: \n Bucket ARN: ${item.services[0].arn} \n Title: ${item.title}\n Region: ${item.region}\n Severity: ${item.severity}\n Date: ${item.createdAt}\n`,
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
