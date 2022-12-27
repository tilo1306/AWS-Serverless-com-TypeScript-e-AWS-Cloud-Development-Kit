/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable import/no-absolute-path */
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import * as AWSXray from "aws-xray-sdk";

import {
  CarrierType,
  IOrderProductResponse,
  IOrderRequest,
  IOrderResponse,
  PaymentType,
  ShippingType,
} from "./ordersApiLayer/nodejs/orderApi";

import { OrderRepository, IOrder } from "/opt/nodejs/ordersLayer";
import { ProductRepository, IProduct } from "/opt/nodejs/productsLayer";

AWSXray.captureAWS(require.resolve("aws-sdk"));
const ordersDdb = process.env.ORDERS_DDB!;
const porductsDdb = process.env.PRODUCTS_DDB!;

const ddbClient = new DynamoDB.DocumentClient();

const orderRepository = new OrderRepository(ddbClient, ordersDdb);
const productRepository = new ProductRepository(ddbClient, porductsDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const apiRequestId = event.requestContext.requestId;
  const lambdaRequestId = context.awsRequestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - LambdaRequestId: ${lambdaRequestId}`
  );

  if (method === "GET") {
    if (event.queryStringParameters) {
      const { email } = event.queryStringParameters!;
      const { orderId } = event.queryStringParameters!;

      if (email) {
        if (orderId) {
          try {
            const order = await orderRepository.getOrder(email, orderId);
            return {
              statusCode: 200,
              body: JSON.stringify(convertToOrderResponse(order)),
            };
          } catch (error) {
            console.log((<Error>error).message);
            return {
              statusCode: 404,
              body: (<Error>error).message,
            };
          }
        }
        const orders = await orderRepository.getOrdersByEmail(email);
        return {
          statusCode: 200,
          body: JSON.stringify(orders.map(convertToOrderResponse)),
        };
      }
    } else {
      const orders = await orderRepository.getallOrders();
      return {
        statusCode: 200,
        body: JSON.stringify(orders.map(convertToOrderResponse)),
      };
    }
  } else if (method === "POST") {
    const orderRequest = JSON.parse(event.body!) as IOrderRequest;

    const products = await productRepository.getProductsByIds(
      orderRequest.productId
    );

    if (products.length === orderRequest.productId.length) {
      const order = buildOrder(orderRequest, products);
      const orderCreated = await orderRepository.createOrder(order);

      return {
        statusCode: 21,
        body: JSON.stringify(convertToOrderResponse(orderCreated)),
      };
    }
    return {
      statusCode: 44,
      body: "Some product was not found",
    };
  } else if (method === "DELETE") {
    const email = event.queryStringParameters!.email!;
    const orderId = event.queryStringParameters!.orderId!;

    try {
      const orderDelete = await orderRepository.deleteOrder(email, orderId);
      return {
        statusCode: 200,
        body: JSON.stringify(convertToOrderResponse(orderDelete)),
      };
    } catch (error) {
      console.log((<Error>error).message);
      return {
        statusCode: 404,
        body: (<Error>error).message,
      };
    }
  }

  return {
    statusCode: 400,
    body: "Bad request",
  };
}

function convertToOrderResponse(order: IOrder): IOrderResponse {
  const orderProducts: IOrderProductResponse[] = [];

  order.products.forEach((product) => {
    orderProducts.push({
      code: product.code,
      price: product.price,
    });
  });
  const orderResponse: IOrderResponse = {
    email: order.pk,
    id: order.sk!,
    createdAt: order.createdAt!,
    products: orderProducts,
    billing: {
      payment: order.billing.paymet as PaymentType,
      totalPrice: order.billing.totalPrice,
    },
    shipping: {
      type: order.shipping.type as ShippingType,
      carrier: order.shipping.carrier as CarrierType,
    },
  };
  return orderResponse;
}

function buildOrder(orderRequest: IOrderRequest, products: IProduct[]): IOrder {
  const orderProducts: IOrderProductResponse[] = [];
  let totalPrice = 0;

  products.forEach((product) => {
    totalPrice += product.price;
    orderProducts.push({
      code: product.code,
      price: product.price,
    });
  });

  const order: IOrder = {
    pk: orderRequest.emai,
    billing: {
      paymet: orderRequest.payment,
      totalPrice,
    },
    shipping: {
      type: orderRequest.shipping.type,
      carrier: orderRequest.shipping.carrier,
    },
    products: orderProducts,
  };
  return order;
}
