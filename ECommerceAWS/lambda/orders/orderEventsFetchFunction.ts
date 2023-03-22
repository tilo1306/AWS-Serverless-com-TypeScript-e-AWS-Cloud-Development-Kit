/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import * as AWSXray from "aws-xray-sdk";

import {
  IOrderEventDdb,
  OrderEventRepository,
} from "./layers/orderEventsRepositoryLayer/nodejs/orderEventRepository";

AWSXray.captureAWS(require("aws-sdk"));

const eventsDdb = process.env.EVENTS_DDB!;

const ddbClient = new DynamoDB.DocumentClient();
const orderEventsRepository = new OrderEventRepository(ddbClient, eventsDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const email = event.queryStringParameters!.email!;
  const { eventType } = event.queryStringParameters!;

  if (eventType) {
    const orderEvents =
      await orderEventsRepository.getOrderEventsByEmailAndEventType(
        email,
        eventType,
      );

    return {
      statusCode: 200,
      body: JSON.stringify(convertOrderEvents(orderEvents)),
    };
  }
  const orderEvents = await orderEventsRepository.getOrderEventsByEmail(email);

  return {
    statusCode: 200,
    body: JSON.stringify(convertOrderEvents(orderEvents)),
  };
}

function convertOrderEvents(orderEvents: IOrderEventDdb[]) {
  return orderEvents.map((orderEvent) => {
    return {
      email: orderEvent.email,
      createdAt: orderEvent.createdAt,
      eventType: orderEvent.eventType,
      requestId: orderEvent.requestId,
      orderId: orderEvent.info.orderId,
      productCodes: orderEvent.info.productCodes,
    };
  });
}
