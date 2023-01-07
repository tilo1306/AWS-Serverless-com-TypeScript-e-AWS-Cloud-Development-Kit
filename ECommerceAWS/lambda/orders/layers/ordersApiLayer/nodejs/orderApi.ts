export enum IPaymentType {
  CASH = "CASH",
  DEBIT_CARD = "DEBIT_CARD",
  CREDIT_CARD = "CREDIT_CARD",
}

export enum IShippingType {
  ECONOMIC = "ECONOMIC",
  URGENT = "URGENT",
}

export enum ICarrierType {
  CORREIOS = "CORREIOS",
  FEDEX = "FEDEX",
}

export interface IOrderRequest {
  email: string;
  productIds: string[];
  payment: IPaymentType;
  shipping: {
    type: IShippingType;
    carrier: ICarrierType;
  };
}

export interface IOrderProductResponse {
  code: string;
  price: number;
}

export interface IOrderResponse {
  email: string;
  id: string;
  createdAt: number;
  billing: {
    payment: IPaymentType;
    totalPrice: number;
  };
  shipping: {
    type: IShippingType;
    carrier: ICarrierType;
  };
  products: IOrderProductResponse[];
}
