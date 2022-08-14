const acij=jest.requireActual("amazon-cognito-identity-js")
module.exports = {
    CognitoUserPool: jest.fn().mockImplementation(require('./CognitoUserPool')),
    CognitoUserAttribute: acij.CognitoUserAttribute,
    CognitoUser: jest.fn().mockImplementation(require("./CognitoUser")),
    AuthenticationDetails: acij.AuthenticationDetails,
    CognitoIdToken: acij.CognitoIdToken,
    CognitoAccessToken: acij.CognitoAccessToken,
    CognitoRefreshToken: acij.CognitoIdToken,
    CognitoUserSession: acij.CognitoUserSession
}