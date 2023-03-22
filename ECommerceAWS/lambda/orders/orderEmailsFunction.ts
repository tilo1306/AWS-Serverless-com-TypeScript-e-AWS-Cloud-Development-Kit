/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Context, SQSEvent, SNSMessage } from "aws-lambda";
import { AWSError, SES } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import * as AWSXRay from "aws-xray-sdk";

import {
  IEnvelope,
  IOrderEvent,
} from "./layers/orderEventsLayer/nodejs/orderEvent";

AWSXRay.captureAWS(require("aws-sdk"));

const sesClient = new SES();

export async function handler(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  const promises: Promise<PromiseResult<SES.SendEmailResponse, AWSError>>[] =
    [];

  event.Records.forEach((record) => {
    const body = JSON.parse(record.body) as SNSMessage;
    promises.push(sendOrderEmail(body));
  });

  await Promise.all(promises);
}

function sendOrderEmail(body: SNSMessage) {
  const envelope = JSON.parse(body.Message) as IEnvelope;
  const event = JSON.parse(envelope.data) as IOrderEvent;

  return sesClient
    .sendEmail({
      Destination: {
        ToAddresses: [event.email],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: `Recebemos seu pedido de número ${event.orderId},
                  no valor de R$ ${event.billing.totalPrice}`,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Recebemos seu pedido!",
        },
      },
      Source: "siecolaaws@gmail.com",
      ReplyToAddresses: ["siecolaaws@gmail.com"],
    })
    .promise();
}
