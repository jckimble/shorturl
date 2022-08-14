import mockAxios from "jest-mock-axios";
const mock=mockAxios.request.getMockImplementation()
mockAxios.request.mockImplementation(async (args)=>{
    if(args.url === 'https://example.com/?config=true'){
        return {
            data: {
                userPoolId: "eu-central-1_xxxxxxx",
                clientId: "testing"
            }
        }
    }
    if(args.url === 'https://example.com/'){
        return {
            data: {
                url: "url",
                short: "short",
                expires_at: 0
            }
        }

    }
    console.log(args)
    return mock
})

export default mockAxios;