import { parse } from "@aws-sdk/util-arn-parser";
import { createTransport } from "nodemailer";

exports.handler = async (event: {
  arn?: string;
  logs?: string[];
  sendEmail?: boolean;
}) => {
  if (event.arn) {
    const { arn } = event;

    const { region, service, resource } = parse(arn);

    return { region: region || "us-east-1", service, resource };
  }

  if (event.sendEmail) {
    console.log("Sending email with logs", event.logs);
    const transporter = createTransport({
      service: "gmail",
      host: process.env?.SMTP_HOST,
      secure: true,
      port: Number(process.env?.SMTP_PORT),
      auth: {
        user: process.env?.SMTP_USERNAME as string,
        pass: process.env?.SMTP_PASSWORD as string,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER as string,
      to: "rupakkarki@lftechnology.com",
      subject: "AWS Ambulance Report",
      text: JSON.stringify(event.logs, null, 2),
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");
  }
};
