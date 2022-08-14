function CognitoUser(data) {
    this.confirmRegistration = jest.fn().mockImplementation((_a1,_a2,callback)=>{
        callback(undefined,undefined)
    })
    this.authenticateUser = jest.fn().mockImplementation((_a, val)=>{
        const acij=jest.requireActual("amazon-cognito-identity-js")
        const idToken = new acij.CognitoIdToken({IdToken: ""})
        const accessToken = new acij.CognitoAccessToken({AccessToken: ""})
        const refreshToken = new acij.CognitoRefreshToken({RefreshToken: ""})
        const session = new acij.CognitoUserSession({
            IdToken: idToken,
            AccessToken: accessToken,
            RefreshToken: refreshToken,
        })
        val.onSuccess(session)
    })
    this.refreshSession = jest.fn().mockImplementation((_a, val)=>{
        const acij=jest.requireActual("amazon-cognito-identity-js")
        const idToken = new acij.CognitoIdToken({IdToken: ""})
        const accessToken = new acij.CognitoAccessToken({AccessToken: ""})
        const refreshToken = new acij.CognitoRefreshToken({RefreshToken: ""})
        const session = new acij.CognitoUserSession({
            IdToken: idToken,
            AccessToken: accessToken,
            RefreshToken: refreshToken,
        })
        val(undefined,session)
    })
    this.setSignInUserSession = jest.fn()
    this.signOut = jest.fn()
}
module.exports = CognitoUser;