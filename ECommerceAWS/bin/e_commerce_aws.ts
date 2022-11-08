#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { ECommerceApiStack } from '../lib/ecommerceApi-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: "636413837519",
  region: "us-east-1"
}

const tags = {
  cost: "ECommerce",
  team: "DougrilhosCode"
}

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  tags:tags,
  env: env
})

const ecommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  tags:tags,
  env: env
})

ecommerceApiStack.addDependency(productsAppStack)
