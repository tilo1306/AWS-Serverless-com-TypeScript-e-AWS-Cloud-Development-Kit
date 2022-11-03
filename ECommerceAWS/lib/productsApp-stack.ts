import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

import{Construct }from 'constructs'

export class ProductsAppStack extends cdk.Stack{
    readonly productsFetchHandler: lambdaNodeJs.NodejsFunction
    readonly productsDdb: dynamodb.Table

    constructor(scope:Construct,id: string,props?: cdk.StackProps){
        super(scope,id,props)

        this.productsDdb = new dynamodb.Table(this, "ProductsDdb",{
        tableName: "products",
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        partitionKey:{
            name: "id",
            type: dynamodb.AttributeType.STRING
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: 1,
        writeCapacity: 1
    })
        this.productsFetchHandler = new lambdaNodeJs.NodejsFunction(this, "ProductsFetchFunction",{
            functionName: "ProductsFetchFunction",
            entry: "lambda/products/productsFetchFunction.ts",
            handler:"handler",
            memorySize: 128,
            timeout: cdk.Duration.seconds(5),
            bundling: {
                minify: true,
                sourceMap:false
            },
        })
    }
}