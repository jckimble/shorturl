import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResult } from 'aws-lambda';
import validUrl from 'valid-url';
import { createHash } from 'crypto';
import CRC32 from "crc-32";
import { getShortCode, createShortCode } from './dbqueries';

export const EXPIRY={
    default: 86400,  // Default of 1 Day
    max: 31536000,   // 1 Year
    min: 3600        // 30 minutes
}

const json = (code: number, data: any): APIGatewayProxyResult => {
    return {
        statusCode: code,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
}

const error = (type: string, code: number, message: string): APIGatewayProxyResult => {
    if(type === 'application/json') {
        return json(code, { message: message })
    } else {
        return {
            statusCode: code,
            headers: {
                'Content-Type': 'text/text'
            },
            body: message
        }
    }
}

const location = (type: string, data: any): APIGatewayProxyResult => {
    switch(type) {
        case 'application/json':
            return json(200, data)
        case 'text/text':
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/text'
                },
                body: data.url
            }
        default:
            return {
                statusCode: 302,
                headers: {
                    'Location': data.url
                },
                body: ""
            }
    }
}

const shortcode = (url: string): string => {
    const hash = createHash('sha256').update(url).digest('hex');
    const checksum = CRC32.buf(Buffer.from(hash), 0)
    return Buffer.from(checksum.toString()).toString('base64')
}

export const handler = async function(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResult> {
    const returnType=event.headers.accept || event.headers['content-type']  || event.headers['Content-Type'] || "text/html"
    switch(event.requestContext.http.method){
        case "GET":
            if(event.queryStringParameters?.config !== undefined){
                return json(200, {
                    userPoolId: process.env.USER_POOL_ID || "",
                    clientId: process.env.USER_POOL_WEB_CLIENT_ID || ""    
                })
            }
            if(event.pathParameters?.short === undefined){
                return location(returnType, { url: "https://github.com/jckimble/shorturl" })
            }
            return new Promise((resolve, _reject) => {
                getShortCode(event.pathParameters?.short || "").then((resp: AWS.DynamoDB.DocumentClient.QueryOutput) => {
                    if(resp.Count === 0){
                        resolve(error(returnType, 404, "Url Not Found Or Has Expired"))
                    }else{
                        resp.Items?.forEach((item)=>{
                            resolve(location(returnType, { url: item.url, short: item.short, expires_at: item.expires_at }));
                        })
                    }
                }).catch((err: Error) => {
                    console.log(err.message)
                    resolve(error(returnType, 500, "An Unexpected Error Occured"))
                })
            })
        case "PUT":
            const username: string = event.requestContext.authorizer.jwt.claims.username.toString();
            const args=JSON.parse(event.body || "{}")
            const url=args.url
            let expire=args.expire
            if(!validUrl.isUri(url)) {
                return error(returnType, 400, "A Valid URL Must Be Provided")
            }
            if(expire === undefined) {
                 expire = EXPIRY.default
            }
            if(expire === 0) {
                expire = EXPIRY.max
            }
            if(expire < EXPIRY.min) {
                return error(returnType, 400, "Expiry is less than this instance allows")
            }
            if(expire > EXPIRY.max) {
                return error(returnType, 400, "Expiry is more than this instance allows")
            }
            var short = shortcode(url)
            var expires_at = Math.round(Date.now() / 1000) + expire
            return new Promise((resolve, _reject) => {
                createShortCode(url, short, expires_at, username).then(() => {
                    resolve(json(200, {
                        url: "https://" + event.requestContext.domainName + "/" + short,
                        short: short,
                        expires_at: expires_at
                    }))
                }).catch((err: Error) => {
                    console.log(err.message)
                    resolve(error(returnType, 500, "An Unexpected Error Occurred"))
                })
            })
        default:
            return error(returnType, 404, "Not Found")
    }
}