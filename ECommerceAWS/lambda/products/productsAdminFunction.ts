
import { APIGatewayProxyEvent,APIGatewayProxyResult,Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context):Promise<APIGatewayProxyResult>{
    
    const lambdaRequestId = context.awsRequestId

    const method =event.httpMethod

    const apiRequestId = event.requestContext.requestId

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`);
    
    if(event.resource === "/products"){
        console.log("POST /products");
        return {
            statusCode: 200,
            body: `Post /products`
        }
        
    } else if( event.resource === "/products/{id}") {
      const productId = event.pathParameters!.id as string
      if (method === "PUT"){
        console.log(`PUT /products/${productId}`);
        return {
            statusCode: 200,
            body: `PUT /products/${productId}`
        }

      }else if (method === "DELETE"){

         console.log(`DELETE /products/${productId}`);
        return {
            statusCode: 200,
            body: `DELETE /products/${productId}`
        }
      }
    }
    return {
      statusCode: 400,
      body: "Bad Request"
    }
}