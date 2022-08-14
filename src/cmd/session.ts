import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';
import axios from 'axios';
import { buildAxiosFetch } from "@lifeomic/axios-fetch";
global.fetch = (input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response> => {
    if(input instanceof URL)
        input=input.toString()
    return buildAxiosFetch(axios)(input,init)
}

export class Session {

    userPool: CognitoUserPool
    session: CognitoUserSession | undefined

    constructor(userPool: CognitoUserPool, session: CognitoUserSession | undefined = undefined) {
        this.userPool = userPool
        this.session = session
    }

    getSession(): Promise<CognitoUserSession> {
        const claims = this.session?.getIdToken().decodePayload()
        const refreshToken = this.session?.getRefreshToken()
        if(claims === undefined || refreshToken === undefined){
            throw Error("No Session To Refresh")
        }
        const cogUser = new CognitoUser({
            Pool: this.userPool,
            Username: claims["email"]
        });
        return new Promise((resolve, reject) => {
            cogUser.refreshSession(refreshToken, (err, session) => {
                if(err){
                    reject(err)
                    return
                }
                this.session = session
                resolve(session)
            })
        })
    }

    signup(email: string, password: string): Promise<CognitoUserSession> {
        return new Promise((resolve, reject) => {
            const emailAttr = new CognitoUserAttribute({ Name: 'email', Value: email })
            this.userPool.signUp(email, password, [emailAttr], [], (err, result) => {
                if(err){
                    reject(err)
                    return
                }
                const session = result?.user.getSignInUserSession()
                if(session !== undefined && session !== null){
                    this.session = session
                    resolve(session)
                }else{
                    reject(Error("Requires Email Confirmation"))
                }
            })
        })
    }

    signin(email: string, password: string): Promise<CognitoUserSession> {
        return new Promise((resolve, reject) => {
            const cogUser = new CognitoUser({
                Pool: this.userPool,
                Username: email
            });
            const authDetails = new AuthenticationDetails({
                Username: email,
                Password: password
            })
            cogUser.authenticateUser(authDetails, {
                onSuccess: result => {
                    this.session = result
                    resolve(result)
                },
                onFailure: err => reject(err)
            })
        })
    }

    confirm(email: string, code: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const cogUser = new CognitoUser({
                Pool: this.userPool,
                Username: email
            });
            cogUser.confirmRegistration(code, true, (err, result) => {
                if(err){
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }

    signout() {
        const session = this.session
        if(session === undefined)
            return
        const claims = session.getIdToken().decodePayload()
        const cogUser = new CognitoUser({
            Pool: this.userPool,
            Username: claims["email"]
        });
        cogUser.setSignInUserSession(session)
        cogUser.signOut()
    }   
}