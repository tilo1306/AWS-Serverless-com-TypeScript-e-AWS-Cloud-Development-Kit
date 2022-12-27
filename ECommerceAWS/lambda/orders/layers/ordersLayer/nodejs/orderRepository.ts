import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";

export interface IOrderProduct {
  code: string;
  price: number;
}

export interface IOrder {
  pk: string;
  sk: string;
  createdAt?: number;
  shipping: {
    type: "URGENT" | "ECONOMIC";
    carrier: "CORREIOS" | "FEDEX";
  };
  billing: {
    paymet: "CASH" | "DEBIT_CARD" | "CREDIT_CARD";
    totalPrice: number;
  };
  products: IOrderProduct[];
}

export class OrderRepository {
  private ddbClient: DocumentClient;
  private ordersDdb: string;

  constructor(ddbClient: DocumentClient, orderDdb: string) {
    this.ddbClient = ddbClient;
    this.ordersDdb = orderDdb;
  }

  async createOrder(order: IOrder): Promise<IOrder> {
    order.sk = uuid();
    order.createdAt = Date.now();
    await this.ddbClient
      .put({
        TableName: this.ordersDdb,
        Item: order,
      })
      .promise();
    return order;
  }
}
