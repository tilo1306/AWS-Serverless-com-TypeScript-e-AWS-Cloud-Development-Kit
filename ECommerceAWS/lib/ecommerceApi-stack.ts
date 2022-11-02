import * as cdk from 'aws-cdk-lib'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'
import * as cwLogs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

export class ECommerceApiStack extends cdk.Stack{
    
    constructor(scope:Construct,id:string, props?: cdk.StackProps){
        super(scope,id,props)

        const api = new apiGateway.RestApi(this,"ECommerceApi",{
            restApiName:"ECommerceApi"
        })
    }
}