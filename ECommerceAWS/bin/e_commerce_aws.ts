#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { ECommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProductsAppLayersStack } from '../lib/productAppLayers-stack';


const app = new cdk.App();

const env: cdk.Environment = {
  account: "636413837519",
  region: "us-east-1"
}

const tags = {
  cost: "ECommerce",
  team: "DougrilhosCode"
}

const productAppLayersStack = new ProductsAppLayersStack(app, "ProductsAppLayers",{
  tags: tags,
  env: env
})

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  tags:tags,
  env: env
})

productsAppStack.addDependency(productAppLayersStack)

const ecommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  tags:tags,
  env: env
})

ecommerceApiStack.addDependency(productsAppStack)
