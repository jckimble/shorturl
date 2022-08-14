import axios, { Method } from 'axios';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { Session } from './session';
import { Config } from './config';

export class Api {
    host: string
    session: Session | undefined
    config: Config | undefined
    constructor(host: string, session: Session | undefined = undefined, config: Config | undefined = undefined) {
        this.host = host
        this.session = session
        this.config = config
    }

    createShortCode(url: string, expire: number) {
        return new Promise((resolve, reject) => {
            if(this.session === undefined){
                reject(Error("Invalid Session"))
                return
            }
            this.session.getSession().then((sess) => {
                if(this.session !== undefined)
                    this.config?.saveSession(this.host, this.session)
                const jwt = sess.getAccessToken().getJwtToken()
                const headers = {
                    'Authorization': "Bearer " + jwt
                }
                const data = {
                    url: url,
                    expire: expire
                }
                this.fetch("/", "PUT", data, headers).then(resolve).catch(reject)
            })
        })
    }

    fetch(path: string, method: Method = 'GET', data: any = {}, headers: any = {}) {
        return new Promise((resolve, reject) => {
            const reqUrl = new URL(path, this.host)
            headers['Content-Type'] = 'application/json'
            axios.request({
                method: method,
                url: reqUrl.toString(),
                data: data,
                headers: headers
            }).then((resp) => {
                resolve(resp.data)
            }).catch(reject)
        })
    }

    getSession(): Promise<Session> {
        return new Promise((resolve,reject)=>{
            this.fetch("/?config=true").then((data: any) => {
                const userPool = new CognitoUserPool({
                    UserPoolId: data.userPoolId,
                    ClientId: data.clientId
                })
                this.session = new Session(userPool)
                resolve(this.session)
            }).catch(reject)
        })
    }
}