#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { AuditEventBusStack } from "../lib/auditEventBus-stack";
import { AuthLayersStack } from "../lib/authLayers-stack";
import { ECommerceApiStack } from "../lib/ecommerceApi-stack";
import { EventsDdbStack } from "../lib/eventsDdb-stack";
import { InvoicesAppLayersStack } from "../lib/invoicesAppLayers-stack";
import { InvoiceWSApiStack } from "../lib/invoiceWSApi-stack";
import { OrdersAppStack } from "../lib/ordersApp-stack";
import { OrdersAppLayersStack } from "../lib/ordersAppLayers-stack";
import { ProductsAppStack } from "../lib/productsApp-stack";
import { ProductsAppLayersStack } from "../lib/productsAppLayers-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: "636413837519",
  region: "us-east-1",
};

const tags = {
  cost: "ECommerce",
  team: "OliveiraTeam",
};

const auditEventBus = new AuditEventBusStack(app, "AuditEvents", {
  tags: {
    cost: "Audit",
    team: "OliveiraTeam",
  },
  env,
});

const authLayersStack = new AuthLayersStack(app, "AuthLayers", {
  tags,
  env,
});

const productsAppLayersStack = new ProductsAppLayersStack(
  app,
  "ProductsAppLayers",
  {
    tags,
    env,
  },
);

const eventsDdbStack = new EventsDdbStack(app, "EventsDdb", {
  tags,
  env,
});

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  eventsDdb: eventsDdbStack.table,
  tags,
  env,
});
productsAppStack.addDependency(productsAppLayersStack);
productsAppStack.addDependency(authLayersStack);
productsAppStack.addDependency(eventsDdbStack);

const ordersAppLayersStack = new OrdersAppLayersStack(app, "OrdersAppLayers", {
  tags,
  env,
});

const ordersAppStack = new OrdersAppStack(app, "OrdersApp", {
  tags,
  env,
  productsDdb: productsAppStack.productsDdb,
  eventsDdb: eventsDdbStack.table,
  auditBus: auditEventBus.bus,
});
ordersAppStack.addDependency(productsAppStack);
ordersAppStack.addDependency(ordersAppLayersStack);
ordersAppStack.addDependency(eventsDdbStack);
ordersAppStack.addDependency(auditEventBus);

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: ordersAppStack.ordersHandler,
  orderEventsFetchHandler: ordersAppStack.orderEventsFetchHandler,
  tags,
  env,
});
eCommerceApiStack.addDependency(productsAppStack);
eCommerceApiStack.addDependency(ordersAppStack);

const invoicesAppLayersStack = new InvoicesAppLayersStack(
  app,
  "InvoicesAppLayer",
  {
    tags: {
      cost: "InvoiceApp",
      team: "SiecolaCode",
    },
    env,
  },
);

const invoiceWSApiStack = new InvoiceWSApiStack(app, "InvoiceApi", {
  eventsDdb: eventsDdbStack.table,
  auditBus: auditEventBus.bus,
  tags: {
    cost: "InvoiceApp",
    team: "SiecolaCode",
  },
  env,
});
invoiceWSApiStack.addDependency(invoicesAppLayersStack);
invoiceWSApiStack.addDependency(eventsDdbStack);
invoiceWSApiStack.addDependency(auditEventBus);
