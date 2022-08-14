import { CognitoUserPool, CognitoIdToken, CognitoAccessToken, CognitoRefreshToken, CognitoUserSession } from 'amazon-cognito-identity-js';
import fs from 'fs';
import { Api } from './api';
import { Session } from './session';

export class Config {
    file: string
    config: any = {
        "services": {}
    }

    constructor(file: string = "~/.shorturl.json"){
        this.file = file.replace("~", process.env.HOME || ".")
        if(fs.existsSync(this.file)){
            let rawdata = fs.readFileSync(this.file);
            this.config = JSON.parse(rawdata.toString("utf-8"));
        }
    }

    getApi(host: string): Api {
        if(host === 'default'){
            host=this.config.default
        }
        const service = this.config.services[host]
        if(service === undefined){
            throw Error("No Saved Session")
        }
        return new Api(host, this.getSession(host), this)
    }

    getSession(host: string): Session {
        if(host === 'default'){
            host = this.config.default
        }
        const service = this.config.services[host]
        if(service === undefined){
            throw Error("No Saved Session")
        }
        const userPool = new CognitoUserPool({
            UserPoolId: service.userPoolId,
            ClientId: service.clientId
        })
        const idToken = new CognitoIdToken({IdToken: service.idToken})
        const accessToken = new CognitoAccessToken({AccessToken: service.accessToken})
        const refreshToken = new CognitoRefreshToken({RefreshToken: service.refreshToken})
        const session = new CognitoUserSession({
            IdToken: idToken,
            AccessToken: accessToken,
            RefreshToken: refreshToken,
        })
        return new Session(userPool, session)
    }

    removeSession(host: string){
        delete this.config.services[host]
        if(this.config.default === host){
            delete this.config.default
        }
        this.save()
    }

    saveSession(host: string, session: Session, setDefault: boolean = false){
        session.getSession().then((sess) => {
            this.config.services[host] = {
                clientId: session.userPool.getClientId(),
                userPoolId: session.userPool.getUserPoolId(),
                accessToken: sess.getAccessToken().getJwtToken(),
                idToken: sess.getIdToken().getJwtToken(),
                refreshToken: sess.getRefreshToken().getToken()
            }
            if(setDefault){
                this.config.default = host
            }
            this.save()
        })
    }

    save() {
        let rawdata = JSON.stringify(this.config)
        fs.writeFileSync(this.file, rawdata)
    }
}