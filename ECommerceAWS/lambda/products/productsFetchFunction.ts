import { APIGatewayProxyEvent,APIGatewayProxyResult,Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context):Promise<APIGatewayProxyResult>{
    
    const lambdaRequestId = context.awsRequestId

    const method =event.httpMethod

    const apiRequestId = event.requestContext.requestId

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`);
    

    if(event.resource === '/products'){
        if(method === 'GET'){
            console.log('GET');
            return {
                statusCode:200,
                body: JSON.stringify({
                    message: 'GET Products -ok'
                })
            }
        }
    } else if (event.resource === "/products/{id}"){
        const productId = event.pathParameters!.id as string
        console.log("GET /products/{id}")
        return{
            statusCode: 200,
            body: "GET /products/{id}"
        }
    }
    return {
        statusCode:400,
        body: JSON.stringify({
                message: 'Bad request'
        })
    }
}