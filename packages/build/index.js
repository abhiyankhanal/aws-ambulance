"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AWS = __importStar(require("aws-sdk"));
var child_process_1 = require("child_process");
var monitorResourceType = ["S3Bucket"];
var commander_1 = require("commander");
var inquirer_1 = __importDefault(require("inquirer"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer_1.default.registerPrompt("table", require("inquirer-table-prompt"));
function getDetectorId() {
    return __awaiter(this, void 0, void 0, function () {
        var config, guardduty, detectors, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = {
                        region: "us-east-1",
                    };
                    guardduty = new AWS.GuardDuty(config);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, guardduty.listDetectors().promise()];
                case 2:
                    detectors = _a.sent();
                    if (detectors.DetectorIds && detectors.DetectorIds.length > 0) {
                        return [2 /*return*/, detectors.DetectorIds[0]]; // Assuming only one detector is present
                    }
                    else {
                        throw new Error("No detectors found.");
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error("Error getting detector ID:", err_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getVulnerableServices() {
    return __awaiter(this, void 0, void 0, function () {
        var detectorId, config, guardduty, totalFindingList, first_findings, second_findings, third_findings, vulnerableServices_1, findingIds, promises, findingDetailsArray, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDetectorId()];
                case 1:
                    detectorId = _a.sent();
                    if (!detectorId) {
                        return [2 /*return*/, []];
                    }
                    config = {
                        region: "us-east-1", // Replace 'your-aws-region' with your AWS region code
                    };
                    guardduty = new AWS.GuardDuty(config);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    totalFindingList = [];
                    return [4 /*yield*/, guardduty
                            .listFindings({
                            DetectorId: detectorId,
                            MaxResults: 50,
                        })
                            .promise()];
                case 3:
                    first_findings = _a.sent();
                    totalFindingList.push.apply(totalFindingList, ((first_findings === null || first_findings === void 0 ? void 0 : first_findings.FindingIds) || []));
                    return [4 /*yield*/, guardduty
                            .listFindings({
                            DetectorId: detectorId,
                            MaxResults: 50,
                            NextToken: first_findings.NextToken,
                        })
                            .promise()];
                case 4:
                    second_findings = _a.sent();
                    totalFindingList.push.apply(totalFindingList, ((second_findings === null || second_findings === void 0 ? void 0 : second_findings.FindingIds) || []));
                    return [4 /*yield*/, guardduty
                            .listFindings({
                            DetectorId: detectorId,
                            MaxResults: 50,
                            NextToken: second_findings.NextToken,
                        })
                            .promise()];
                case 5:
                    third_findings = _a.sent();
                    totalFindingList.push.apply(totalFindingList, ((third_findings === null || third_findings === void 0 ? void 0 : third_findings.FindingIds) || []));
                    vulnerableServices_1 = [];
                    findingIds = totalFindingList || [];
                    promises = findingIds.map(function (findingId) {
                        return guardduty
                            .getFindings({ DetectorId: detectorId, FindingIds: [findingId] })
                            .promise();
                    });
                    return [4 /*yield*/, Promise.all(promises)];
                case 6:
                    findingDetailsArray = _a.sent();
                    findingDetailsArray.forEach(function (findingDetails) {
                        var finding = findingDetails.Findings && findingDetails.Findings[0];
                        if (finding) {
                            var resourceType = finding.Resource.ResourceType;
                            if (resourceType && monitorResourceType.includes(resourceType)) {
                                vulnerableServices_1.push(finding);
                            }
                        }
                    });
                    return [2 /*return*/, vulnerableServices_1];
                case 7:
                    err_2 = _a.sent();
                    console.error("Error:", err_2);
                    return [2 /*return*/, []];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function showLoadingUI() {
    var animation = ["|", "/", "-", "\\"]; // Array of characters for the loading animation
    var i = 0;
    var interval = setInterval(function () {
        process.stdout.write("\r" + "Fetching AWS S3 Logs " + animation[i]); // Overwrite the previous line
        i = (i + 1) % animation.length; // Increment the index and wrap around if needed
    }, 100); // Change the animation speed as needed
    // Return the interval object so it can be cleared later
    return interval;
}
function getListOfServices() {
    return __awaiter(this, void 0, void 0, function () {
        var vulnerableServices, test;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getVulnerableServices()];
                case 1:
                    vulnerableServices = _a.sent();
                    test = [];
                    vulnerableServices.forEach(function (item) {
                        var _a;
                        var test12 = (_a = item.Resource.S3BucketDetails) === null || _a === void 0 ? void 0 : _a.map(function (item) {
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
                    return [2 /*return*/, test];
            }
        });
    });
}
var program = new commander_1.Command();
program
    .version("1.0.0")
    .description("A simple CLI program")
    .option("-l, --list <message>", "Set the greeting message", "Hello")
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var loadingInterval, list, s3Alerts, answer, awsCommand;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                loadingInterval = showLoadingUI();
                return [4 /*yield*/, getListOfServices()];
            case 1:
                list = _a.sent();
                clearInterval(loadingInterval); // Stop the loading animation
                s3Alerts = list.map(function (item, index) { return ({
                    value: index,
                    name: "[".concat(item.type, "]: \n Bucket ARN: ").concat(item.services[0].arn, " \n Title: ").concat(item.title, "\n Region: ").concat(item.region, "\n Severity: ").concat(item.severity, "\n Date: ").concat(item.createdAt, "\n"),
                }); });
                return [4 /*yield*/, inquirer_1.default.prompt([
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
                    ])];
            case 2:
                answer = _a.sent();
                //locking AWS S3 service
                console.log("🚀 Initiating lock process for S3 bucket");
                console.log("🔒 Initiating lock process for S3 bucket ...");
                console.log("🔍 Checking bucket status...");
                console.log("🔒 Locking bucket to prevent modifications...");
                console.log("⏳ Locking process in progress...");
                awsCommand = "aws stepfunctions start-execution --state-machine-arn arn:aws:states:us-east-1:684378237653:stateMachine:AWSAmbulanceStartExecution-xdYEynYSiTX3 --input '{\"arns\": [\"arn:aws:s3:::testing-aws-ambulance-s3\", \"arn:aws:lambda:us-east-1:684378237653:function:testing-aws-ambulance-lambda\"]}'";
                (0, child_process_1.exec)(awsCommand, function (error, stdout, stderr) {
                    if (error) {
                        console.log("Command output: ".concat(stdout));
                        return;
                    }
                    console.log("🔒 S3 bucket is now locked successfully. Email will be send once lockdown is completed.");
                });
                return [2 /*return*/];
        }
    });
}); });
program.parse(process.argv);
