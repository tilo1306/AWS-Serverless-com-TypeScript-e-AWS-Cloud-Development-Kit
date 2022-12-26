#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { ECommerceApiStack } from "../lib/ecommerceApi-stack";
import { EventsDdbStack } from "../lib/eventsDdb-stack";
import { ProductsAppLayersStack } from "../lib/productAppLayers-stack";
import { ProductsAppStack } from "../lib/productsApp-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: "636413837519",
  region: "us-east-1",
};

const tags = {
  cost: "ECommerce",
  team: "DougrilhosCode",
};

const productAppLayersStack = new ProductsAppLayersStack(
  app,
  "ProductsAppLayers",
  {
    tags,
    env,
  }
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

productsAppStack.addDependency(productAppLayersStack);
productsAppStack.addDependency(eventsDdbStack);

const ecommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  tags,
  env,
});

ecommerceApiStack.addDependency(productsAppStack);
