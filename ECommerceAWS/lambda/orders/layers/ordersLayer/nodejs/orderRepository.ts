import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface IOrderProduct {
  code: string;
  price: number;
}

export interface IOrder {
  pk: string;
  sk: string;
  createdAt: number;
  shipping: {
    type: "URGENT" | "ECONOMIC";
    carrier: "CORREIOS" | "FEDEX";
  };
  billing: {
    payment: "CASH" | "DEBIT_CARD" | "CREDIT_CARD";
    totalPrice: number;
  };
  products?: IOrderProduct[];
}

export class OrderRepository {
  private ddbClient: DocumentClient;
  private ordersDdb: string;

  constructor(ddbClient: DocumentClient, orderDdb: string) {
    this.ddbClient = ddbClient;
    this.ordersDdb = orderDdb;
  }

  async createOrder(order: IOrder): Promise<IOrder> {
    await this.ddbClient
      .put({
        TableName: this.ordersDdb,
        Item: order,
      })
      .promise();
    return order;
  }

  async getAllOrders(): Promise<IOrder[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.ordersDdb,
        ProjectionExpression: "pk, sk, createdAt, shipping, billing",
      })
      .promise();
    return data.Items as IOrder[];
  }

  async getOrdersByEmail(email: string): Promise<IOrder[]> {
    const data = await this.ddbClient
      .query({
        TableName: this.ordersDdb,
        KeyConditionExpression: "pk = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
        ProjectionExpression: "pk, sk, createdAt, shipping, billing",
      })
      .promise();
    return data.Items as IOrder[];
  }

  async getOrder(email: string, orderId: string): Promise<IOrder> {
    const data = await this.ddbClient
      .get({
        TableName: this.ordersDdb,
        Key: {
          pk: email,
          sk: orderId,
        },
      })
      .promise();
    if (data.Item) {
      return data.Item as IOrder;
    }
    throw new Error("Order not found");
  }

  async deleteOrder(email: string, orderId: string): Promise<IOrder> {
    const data = await this.ddbClient
      .delete({
        TableName: this.ordersDdb,
        Key: {
          pk: email,
          sk: orderId,
        },
        ReturnValues: "ALL_OLD",
      })
      .promise();
    if (data.Attributes) {
      return data.Attributes as IOrder;
    }
    throw new Error("Order not found");
  }
}
