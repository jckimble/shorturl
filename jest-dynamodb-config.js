module.exports = {
    tables: [
      {
        TableName: `shortUrl`,
        KeySchema: [
          {
            AttributeName: 'shortcode', 
            KeyType: 'HASH'
          },
          {
            AttributeName: 'expires_at', 
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'shortcode', 
            AttributeType: 'S'
          },
          {
            AttributeName: 'expires_at', 
            AttributeType: 'N'
          }
        ],
        TimeToLiveSpecification: [
          {
            AttributeName: 'expires_at', 
            Enabled:true
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1, 
          WriteCapacityUnits: 1
        }
      },
    ],
  };