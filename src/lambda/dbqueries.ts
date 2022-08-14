import AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient((process.env.IS_OFFLINE || process.env.JEST_WORKER_ID)?{
    region: 'localhost',
    endpoint: 'http://127.0.0.1:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',
    secretAccessKey: 'DEFAULT_SECRET',
}:{});

export const createShortCode = (url: string, short: string, expires_at: number, owner: string) => {
    var inParams = {
        TableName: 'shortUrl',
        Item:{
            shortcode: short,
            url: url,
            expires_at: expires_at,
            owner: owner
        },
        ConditionExpression: "attribute_not_exists(shortcode)",
    }
    return docClient.put(inParams).promise()
}

export const getShortCode = (short: string) => {
    var params = {
        TableName: 'shortUrl',
        KeyConditionExpression: 'shortcode = :shortcode and expires_at >= :currentTime',
        ExpressionAttributeValues: {
            ':shortcode': short,
            ':currentTime': Math.round(Date.now() / 1000),
        },
    };
    return docClient.query(params).promise()
}