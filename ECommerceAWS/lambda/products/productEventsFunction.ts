/* eslint-disable no-use-before-define */
/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-absolute-path */
import { Callback, Context } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";

import { IProductEvent } from "/opt/nodejs/productEventsLayer";

AWSXRay.captureAWS(require("aws-sdk"));

const eventsDdb = process.env.EVENTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

export async function handler(
  event: IProductEvent,
  context: Context,
  callback: Callback
): Promise<void> {
  // TODO - to be removed
  console.log(event);

  console.log(`Lambda requestId: ${context.awsRequestId}`);

  await createEvent(event);

  callback(
    null,
    JSON.stringify({
      productEventCreated: true,
      message: "OK",
    })
  );
}

function createEvent(event: IProductEvent) {
  const timestamp = Date.now();
  const ttl = ~~(timestamp / 1000 + 5 + 60); // 5 minutos à frente

  return ddbClient
    .put({
      TableName: eventsDdb,
      Item: {
        pk: `#product_${event.productCode}`,
        sk: `${event.eventType}#${timestamp}`, // PRODUCT_CREATED#123465
        email: event.email,
        createdAt: timestamp,
        requestId: event.requestId,
        eventType: event.eventType,
        info: {
          productId: event.productId,
          price: event.productPrice,
        },
        ttl,
      },
    })
    .promise();
}
