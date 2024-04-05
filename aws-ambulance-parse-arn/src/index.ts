import { parse } from "@aws-sdk/util-arn-parser";

exports.handler = async (event: { arn: string }) => {
  const { arn } = event;

  const { region, service, resource } = parse(arn);

  return { region: region || "us-east-1", service, resource };
};
