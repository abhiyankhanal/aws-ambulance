import { EC2 } from "@aws-sdk/client-ec2";

exports.handler = async (event: { region: string; instanceId: string }) => {
  const { region, instanceId } = event;

  const logs = [];

  if (!region || !instanceId) {
    logs.push({ "Error": `Missing region or instanceId in the event payload while running the operations for EC2` });
    return logs;
  }

  const ec2 = new EC2({ region });

  try {
    // Create a new security group with no inbound or outbound rules
    const createGroupParams = {
      Description: "Secure security group with no inbound or outbound access",
      GroupName: "SecureSecurityGroup",
    };
    const createGroupResult = await ec2.createSecurityGroup(createGroupParams);
    const secureSecurityGroupId = createGroupResult.GroupId??'';

    await ec2.modifyInstanceAttribute({
      InstanceId: instanceId,
      Groups: [secureSecurityGroupId],
    });

    logs.push({ "Success": `Secure security group created and associated with ${instanceId}` });
  } catch (error) {
    logs.push({ "Error": `Failed to create secure security group or associate it with ${instanceId}`, error });
  }

  try {
    // Describe the instance to get its current Elastic IP
    const describeParams = {
      InstanceIds: [instanceId]
    };
    const describeResult = await ec2.describeInstances(describeParams);
    const elasticIp = describeResult.Reservations?.[0].Instances?.[0].PublicIpAddress;

    if (elasticIp) {
      // Disassociate Elastic IP
      await ec2.disassociateAddress({
        AssociationId: elasticIp
      });
      logs.push({ "Success": `Elastic IP disassociated successfully from ${instanceId}` });
    } else {
      logs.push({ "Warning": `No Elastic IP associated with ${instanceId}` });
    }
  } catch (error) {
    logs.push({ "Error": `Failed to disassociate Elastic IP from ${instanceId}`, error });
  }
  
  return logs;
};
