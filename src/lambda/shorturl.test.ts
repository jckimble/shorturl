import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { handler, EXPIRY } from './shorturl';

const mockEvent = (event: Partial<APIGatewayProxyEventV2WithJWTAuthorizer> = {}, method: string = "GET", username: string = ""): APIGatewayProxyEventV2WithJWTAuthorizer => {
    const defaults: APIGatewayProxyEventV2WithJWTAuthorizer = {
        version: "2.0",
        routeKey: "",
        rawPath: "",
        rawQueryString: "",
        headers: {},
        requestContext: {
            accountId:"",
            apiId: "",
            domainName: "",
            domainPrefix: "",
            requestId: "",
            routeKey: "",
            time: "",
            timeEpoch: Math.round(Date.now() / 1000),
            stage: "$latest",
            http: {
                method: method,
                protocol: "",
                sourceIp: "127.0.0.1",
                userAgent: "Jest",
                path: ""
            },
            authorizer: {
                principalId: "",
                integrationLatency: 0,
                jwt: {
                    claims: {
                        "username": username
                    },
                    scopes: []
                }
            }
        },
        isBase64Encoded: false
    }
    return Object.assign(defaults, event)
}

it('shameless self-promotion', async () => {
    const redirectEvent = mockEvent()
    const resp = await handler(redirectEvent)
    expect(resp.statusCode).toEqual(302)
    expect(resp.headers).toBeDefined()
    if(resp.headers)
        expect(resp.headers['Location']).toEqual("https://github.com/jckimble/shorturl")
})

it('fetchable config', async () => {
    const event=mockEvent({
        queryStringParameters: {
            config: "true",
        }
    })
    const resp = await handler(event)
    expect(resp.statusCode).toEqual(200)
    expect(resp.headers).toBeDefined()
    if(resp.headers)
        expect(resp.headers['Content-Type']).toEqual("application/json")
    const data = JSON.parse(resp.body)
    expect(data.clientId).not.toBeUndefined()
    expect(data.userPoolId).not.toBeUndefined()
})

it('404 errors', async () => {
    const testResponse = (resp, contentType) => {
        expect(resp.statusCode).toEqual(404)
        expect(resp.headers).toBeDefined()
        if(resp.headers)
            expect(resp.headers['Content-Type']).toEqual(contentType)
    }
    const tests = [
        {
            headers: {
                "accept": "application/json"
            },
            pathParameters: {
                short: "Unknown"
            }
        },
        {
            headers: {
                "accept": "text/text"
            },
            pathParameters: {
                short: "Unknown"
            }
        }
    ]
    tests.forEach(async (test) => {
        const redirectEvent = mockEvent(test)
        const lambdaredirect = await handler(redirectEvent)
        testResponse(lambdaredirect, test.headers?.['accept'] || "text/text")
    })
})

it('create validation', async () => {
    const tests=[
        {
            url: "InvalidURL",
        },
        { 
            url: "https://example.com",
            expire: EXPIRY.min - 10
        },
        { 
            url: "https://example.com",
            expire: EXPIRY.max + 10
        }
    ]
    tests.forEach(async val => {
        const createEvent = mockEvent({
            body: JSON.stringify(val)
        }, "PUT", "testuser")
        const lambdacreate = await handler(createEvent)
        expect(lambdacreate.statusCode).toEqual(400)    
    })
})

it('browser redirect', async () => {
    const createEvent = mockEvent({
        body: JSON.stringify({ url: "https://example.com/?browser" })
    }, "PUT", "testuser")
    const lambdacreate = await handler(createEvent)
    expect(lambdacreate.statusCode).toEqual(200)
    expect(lambdacreate.headers).toBeDefined()
    if(lambdacreate.headers)
        expect(lambdacreate.headers['Content-Type']).toEqual("application/json")
    const j = JSON.parse(lambdacreate.body)

    const redirectEvent = mockEvent({
        pathParameters: {
            short: j.short
        }
    })
    const lambdaredirect = await handler(redirectEvent)
    expect(lambdaredirect.statusCode).toEqual(302)
    expect(lambdaredirect.headers).toBeDefined()
    if(lambdaredirect.headers)
        expect(lambdaredirect.headers['Location']).toEqual("https://example.com/?browser")
})

it('text and json response', async () => {
    const createEvent = mockEvent({
        body: JSON.stringify({ url: "https://test.example.com", expire: 0 })
    }, "PUT", "testuser")
    const lambdacreate = await handler(createEvent)
    expect(lambdacreate.statusCode).toEqual(200)
    expect(lambdacreate.headers).toBeDefined()
    if(lambdacreate.headers)
        expect(lambdacreate.headers['Content-Type']).toEqual("application/json")
    const j = JSON.parse(lambdacreate.body)

    var redirectEvent = mockEvent({
        headers: {
            "accept": "application/json"
        },
        pathParameters: {
            short: j.short
        }
    })
    var resp = await handler(redirectEvent)
    expect(resp.statusCode).toEqual(200)
    expect(resp.headers).toBeDefined()
    if(resp.headers)
        expect(resp.headers['Content-Type']).toEqual("application/json")

    redirectEvent = mockEvent({
        headers: {
            "accept": "text/text"
        },
        pathParameters: {
            short: j.short
        }
    })
    resp = await handler(redirectEvent)
    expect(resp.statusCode).toEqual(200)
    expect(resp.headers).toBeDefined()
    if(resp.headers)
        expect(resp.headers['Content-Type']).toEqual("text/text")
})