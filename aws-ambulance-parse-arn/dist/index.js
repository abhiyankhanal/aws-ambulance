"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_arn_parser_1 = require("@aws-sdk/util-arn-parser");
const nodemailer_1 = require("nodemailer");
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (event.arn) {
        const { arn } = event;
        const { region, service, resource } = (0, util_arn_parser_1.parse)(arn);
        return { region: region || "us-east-1", service, resource };
    }
    if (event.sendEmail) {
        console.log("Sending email with logs", event.logs);
        const transporter = (0, nodemailer_1.createTransport)({
            service: "gmail",
            host: (_a = process.env) === null || _a === void 0 ? void 0 : _a.SMTP_HOST,
            secure: true,
            port: Number((_b = process.env) === null || _b === void 0 ? void 0 : _b.SMTP_PORT),
            auth: {
                user: (_c = process.env) === null || _c === void 0 ? void 0 : _c.SMTP_USERNAME,
                pass: (_d = process.env) === null || _d === void 0 ? void 0 : _d.SMTP_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: "rupakkarki@lftechnology.com",
            subject: "AWS Ambulance Report",
            text: JSON.stringify(event.logs, null, 2),
        };
        yield transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    }
});
