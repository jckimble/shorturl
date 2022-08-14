function CognitoUserPool(data) {
    const { UserPoolId, ClientId } = data;
    this.userPoolId = UserPoolId;
    this.clientId = ClientId;
    this.getCurrentUser = jest.fn().mockReturnValue('cognitouserpool');
    this.signUp = jest.fn().mockImplementation((_a1,_a2,_a3,_a4,callback)=>{
        callback(undefined,undefined)
    })
    this.getClientId = jest.fn().mockReturnValue(this.clientId)
    this.getUserPoolId = jest.fn().mockReturnValue(this.userPoolId)
}
module.exports = CognitoUserPool;