import { signupCommand, signinCommand, signoutCommand, createCommand } from './cli';

jest.setTimeout(30000)

it('test workflow', async () => {

    await signupCommand("https://example.com", {
        email: "test@example.com",
        password: "Testing123!@#$"
    }).catch(err=>{
        expect(err.message).toBe("Requires Email Confirmation")
    })
    await signinCommand("https://example.com", {
        email: "test@example.com",
        password: "Testing123!@#$",
        code: "000000",
        default: true
    })

    await createCommand("https://example.com", { expire: 3600, service: "default" })

    await signoutCommand("https://example.com", {})
})