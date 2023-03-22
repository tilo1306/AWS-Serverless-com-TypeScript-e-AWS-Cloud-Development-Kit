/* eslint-disable no-new */
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apigatewayv2_integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Events } from "aws-sdk/clients/devopsguru";
import { Construct } from "constructs";

interface IInvoiceWSApiStackProps extends cdk.StackProps {
  eventsDdb: dynamodb.Table;
  auditBus: events.EventBus;
}

export class InvoiceWSApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IInvoiceWSApiStackProps) {
    super(scope, id, props);

    const invoiceTransactionLayerArn =
      ssm.StringParameter.valueForStringParameter(
        this,
        "InvoiceTransactionLayerVersionArn",
      );
    const invoiceTransactionLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "InvoiceTransactionLayer",
      invoiceTransactionLayerArn,
    );

    const invoiceLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "InvoiceRepositoryLayerVersionArn",
    );
    const invoiceLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "InvoiceRepositoryLayer",
      invoiceLayerArn,
    );

    const invoiceWSConnectionLayerArn =
      ssm.StringParameter.valueForStringParameter(
        this,
        "InvoiceWSConnectionLayerVersionArn",
      );
    const invoiceWSConnectionLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "InvoiceWSConnectionLayer",
      invoiceWSConnectionLayerArn,
    );

    const invoicesDdb = new dynamodb.Table(this, "InvoicesDdb", {
      tableName: "invoices",
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const bucket = new s3.Bucket(this, "InvoiceBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(1),
        },
      ],
    });

    const connectionHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "InvoiceConnectionFunction",
      {
        functionName: "InvoiceConnectionFunction",
        entry: "lambda/invoices/invoiceConnectionFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        tracing: lambda.Tracing.ACTIVE,
      },
    );

    const disconnectionHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "InvoiceDisconnectionFunction",
      {
        functionName: "InvoiceDisconnectionFunction",
        entry: "lambda/invoices/invoiceDisconnectionFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        tracing: lambda.Tracing.ACTIVE,
      },
    );

    const webSocketApi = new apigatewayv2.WebSocketApi(this, "InvoiceWSApi", {
      apiName: "InvoiceWSApi",
      connectRouteOptions: {
        integration: new apigatewayv2_integrations.WebSocketLambdaIntegration(
          "ConnectionHandler",
          connectionHandler,
        ),
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2_integrations.WebSocketLambdaIntegration(
          "DisconnectionHandler",
          disconnectionHandler,
        ),
      },
    });

    const stage = "prod";
    const wsApiEndpoint = `${webSocketApi.apiEndpoint}/${stage}`;
    new apigatewayv2.WebSocketStage(this, "InvoiceWSApiStage", {
      webSocketApi,
      stageName: stage,
      autoDeploy: true,
    });

    const getUrlHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "InvoiceGetUrlFunction",
      {
        functionName: "InvoiceGetUrlFunction",
        entry: "lambda/invoices/invoiceGetUrlFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        layers: [invoiceTransactionLayer, invoiceWSConnectionLayer],
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          INVOICE_DDB: invoicesDdb.tableName,
          BUCKET_NAME: bucket.bucketName,
          INVOICE_WSAPI_ENDPOINT: wsApiEndpoint,
        },
      },
    );
    const invoicesDdbWriteTransactionPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:PutItem"],
      resources: [invoicesDdb.tableArn],
      conditions: {
        "ForAllValues:StringLike": {
          "dynamodb:LeadingKeys": ["#transaction"],
        },
      },
    });
    const invoicesBucketPutObjectPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:PutObject"],
      resources: [`${bucket.bucketArn}/*`],
    });

    getUrlHandler.addToRolePolicy(invoicesDdbWriteTransactionPolicy);
    getUrlHandler.addToRolePolicy(invoicesBucketPutObjectPolicy);
    webSocketApi.grantManageConnections(getUrlHandler);

    const invoiceImportHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "InvoiceImportFunction",
      {
        functionName: "InvoiceImportFunction",
        entry: "lambda/invoices/invoiceImportFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        layers: [
          invoiceLayer,
          invoiceTransactionLayer,
          invoiceWSConnectionLayer,
        ],
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          INVOICE_DDB: invoicesDdb.tableName,
          INVOICE_WSAPI_ENDPOINT: wsApiEndpoint,
          AUDIT_BUS_NAME: props.auditBus.eventBusName,
        },
      },
    );
    props.auditBus.grantPutEventsTo(invoiceImportHandler);
    invoicesDdb.grantReadWriteData(invoiceImportHandler);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(invoiceImportHandler),
    );

    const invoicesBucketGetDeleteObjectPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:DeleteObject", "s3:GetObject"],
      resources: [`${bucket.bucketArn}/*`],
    });
    invoiceImportHandler.addToRolePolicy(invoicesBucketGetDeleteObjectPolicy);
    webSocketApi.grantManageConnections(invoiceImportHandler);

    const cancelImportHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "CancelImportFunction",
      {
        functionName: "CancelImportFunction",
        entry: "lambda/invoices/cancelImportFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        layers: [invoiceTransactionLayer, invoiceWSConnectionLayer],
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          INVOICE_DDB: invoicesDdb.tableName,
          INVOICE_WSAPI_ENDPOINT: wsApiEndpoint,
        },
      },
    );
    const invoicesDdbReadWriteTransactionPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:UpdateItem", "dynamodb:GetItem"],
      resources: [invoicesDdb.tableArn],
      conditions: {
        "ForAllValues:StringLike": {
          "dynamodb:LeadingKeys": ["#transaction"],
        },
      },
    });
    cancelImportHandler.addToRolePolicy(invoicesDdbReadWriteTransactionPolicy);
    webSocketApi.grantManageConnections(cancelImportHandler);

    webSocketApi.addRoute("getImportUrl", {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration(
        "GetUrlHandler",
        getUrlHandler,
      ),
    });

    webSocketApi.addRoute("cancelImport", {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration(
        "CancelImportHandler",
        cancelImportHandler,
      ),
    });

    const invoiceEventsHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "InvoiceEventsFunction",
      {
        functionName: "InvoiceEventsFunction",
        entry: "lambda/invoices/invoiceEventsFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          EVENTS_DDB: props.eventsDdb.tableName,
          INVOICE_WSAPI_ENDPOINT: wsApiEndpoint,
          AUDIT_BUS_NAME: props.auditBus.eventBusName,
        },
        layers: [invoiceWSConnectionLayer],
      },
    );
    props.auditBus.grantPutEventsTo(invoiceEventsHandler);
    const eventsDdbPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:PutItem"],
      resources: [props.eventsDdb.tableArn],
      conditions: {
        "ForAllValues:StringLike": {
          "dynamodb:LeadingKeys": ["#invoice_*"],
        },
      },
    });
    invoiceEventsHandler.addToRolePolicy(eventsDdbPolicy);
    webSocketApi.grantManageConnections(invoiceEventsHandler);

    const invoiceEventsDlq = new sqs.Queue(this, "InvoiceEventsDlq", {
      queueName: "invoice-events-dlq",
    });

    invoiceEventsHandler.addEventSource(
      new lambdaEventSources.DynamoEventSource(invoicesDdb, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        bisectBatchOnError: true,
        onFailure: new lambdaEventSources.SqsDlq(invoiceEventsDlq),
        retryAttempts: 3,
      }),
    );
  }
}
