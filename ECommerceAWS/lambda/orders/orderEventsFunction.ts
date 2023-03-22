/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Context, SNSEvent, SNSMessage } from "aws-lambda";
import { AWSError, DynamoDB } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import * as AWSXRay from "aws-xray-sdk";

import {
  IEnvelope,
  IOrderEvent,
} from "./layers/orderEventsLayer/nodejs/orderEvent";
import {
  OrderEventRepository,
  IOrderEventDdb,
} from "./layers/orderEventsRepositoryLayer/nodejs/orderEventRepository";

AWSXRay.captureAWS(require("aws-sdk"));

const eventsDdb = process.env.EVENTS_DDB!;

const ddbClient = new DynamoDB.DocumentClient();
const orderEventsRepository = new OrderEventRepository(ddbClient, eventsDdb);

export async function handler(
  event: SNSEvent,
  context: Context,
): Promise<void> {
  const promises: Promise<
    PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>
  >[] = [];

  event.Records.forEach((record) => {
    promises.push(createEvent(record.Sns));
  });

  await Promise.all(promises);
}

function createEvent(body: SNSMessage) {
  const envelope = JSON.parse(body.Message) as IEnvelope;
  const event = JSON.parse(envelope.data) as IOrderEvent;

  console.log(`Order event - MessageId: ${body.MessageId}`);

  const timestamp = Date.now();
  const ttl = ~~(timestamp / 1000 + 5 * 60);

  const orderEventDdb: IOrderEventDdb = {
    pk: `#order_${event.orderId}`,
    sk: `${envelope.eventType}#${timestamp}`,
    ttl,
    email: event.email,
    createdAt: timestamp,
    requestId: event.requestId,
    eventType: envelope.eventType,
    info: {
      orderId: event.orderId,
      productCodes: event.productCodes,
      messageId: body.MessageId,
    },
  };
  return orderEventsRepository.createOrderEvent(orderEventDdb);
}
