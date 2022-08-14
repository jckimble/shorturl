#!/usr/bin/env node

'use strict';
import path from 'path';
import { Command } from 'commander';
import { Api } from './api';
import { Config } from './config';

export const createCommand = (url: string, options: any) => {
    const config = new Config()
    config.getApi(options.service).createShortCode(url, options.expire).then((resp: any) => {
        console.log(resp.url)
    }).catch((err: any) => {
        console.error(err.message)
    })
}

export const signoutCommand = async (domain: string, options: any) => {
    const config = new Config()
    config.getSession(domain).signout()
    config.removeSession(domain)
}

export const signinCommand = async (domain: string, options: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const api = new Api(domain)
        const config = new Config()
        api.getSession().then((sess) => {
            const signin=() => {
                sess.signin(options.email,options.password).then(() => {
                    config.saveSession(domain, sess, options.default)
                    resolve()
                }).catch(reject)    
            }
            if(options.code !== undefined){
                sess.confirm(options.email, options.code).then(signin).catch(reject)
            }else{
                signin()
            }
        }).catch(reject)
    })
}

export const signupCommand = (domain: string, options: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const api = new Api(domain)
        const config = new Config()
        api.getSession().then((sess) => {
            sess.signup(options.email,options.password).then(() => {
                config.saveSession(domain, sess, options.default)
                resolve()
            }).catch(reject)
        }).catch(reject)
    })
}

const program = new Command();
program.name('shorturl').description('CLI to create shorturls');

program.command('create').description('Create Short Url')
    .arguments('<url>')
    .option('-e, --expire <int>', 'Expire in seconds')
    .option('-s, --service <service>', 'Service url', 'default')
    .action(createCommand);

program.command('signout').description('Signout shorturl service')
    .arguments('<domain>')
    .action(signoutCommand)

program.command('signin').description('Signin shorturl service')
    .arguments('<domain>')
    .option("--email <email>", "Email")
    .option("--password <password>", "Password")
    .option("--code <code>", "Confirm Code for confirming registration")
    .option("-d, --default", "Set Service as Default")
    .action(signinCommand)

program.command('signup').description('Signup for shorturl service')
    .arguments('<domain>')
    .option("--email <email>", "Email")
    .option("--password <password>", "Password")
    .action(signupCommand)

const runCli=() => {
    const exe = path.basename(process.argv[0])
    if(exe === 'node'){
        const script=path.basename(process.argv[1])
        return script === 'cli.js'
    }
    return exe === 'shorturl'
}
if(runCli())
    program.parse(process.argv);