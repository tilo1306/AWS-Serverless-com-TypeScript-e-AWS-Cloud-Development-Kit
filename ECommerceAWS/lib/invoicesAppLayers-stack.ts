/* eslint-disable no-new */
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class InvoicesAppLayersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const invoiceTransactionLayer = new lambda.LayerVersion(
      this,
      "InvoiceTransactionLayer",
      {
        code: lambda.Code.fromAsset(
          "lambda/invoices/layers/invoiceTransaction",
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
        layerVersionName: "InvoiceTransactionLayer",
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    );

    new ssm.StringParameter(this, "InvoiceTransactionLayerVersionArn", {
      parameterName: "InvoiceTransactionLayerVersionArn",
      stringValue: invoiceTransactionLayer.layerVersionArn,
    });

    const invoiceLayer = new lambda.LayerVersion(this, "InvoiceLayer", {
      code: lambda.Code.fromAsset("lambda/invoices/layers/invoiceRepository"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      layerVersionName: "InvoiceRepository",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new ssm.StringParameter(this, "InvoiceRepositoryLayerVersionArn", {
      parameterName: "InvoiceRepositoryLayerVersionArn",
      stringValue: invoiceLayer.layerVersionArn,
    });

    const invoiceWSConnectionLayer = new lambda.LayerVersion(
      this,
      "InvoiceWSConnectionLayer",
      {
        code: lambda.Code.fromAsset(
          "lambda/invoices/layers/invoiceWSConnection",
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
        layerVersionName: "InvoiceWSConnection",
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    );

    new ssm.StringParameter(this, "InvoiceWSConnectionLayerVersionArn", {
      parameterName: "InvoiceWSConnectionLayerVersionArn",
      stringValue: invoiceWSConnectionLayer.layerVersionArn,
    });
  }
}
