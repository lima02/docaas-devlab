const jwt = require('jsonwebtoken');
const debugLogging = process.env.DEBUG_LOGGING || "false" === "true";
module.exports.isDebugLogging = function() {
    return debugLogging;
}

class Helper {
    constructor(event) {
        this._event = event;
        this._jwt = this.event.headers.Authorization || this.event.headers.authorization;
        this._claims = this.event.requestContext.authorizer.claims || jwt.decode(this._jwt);
        this._aws = require('aws-sdk');
    }

    async getScores(name) {
        return this._callGameDataAccess("get", { name:name });
    }
    async saveScores(deck) {
        return this._callGameDataAccess("save", { deck:deck });
    }
    
    get event() {
      return this._event;
    }

    get jwt() {
        return this._jwt;
    }

    get claims() {
        return this._claims;
    }

    get plan() {
        return this._claims["custom:plan"];
    }

    get role() {
        return this._claims["cognito:preferred_role"];
    }

    getParam(name) {
        let val = this._event.queryStringParameters ? this._event.queryStringParameters[name] : null;
        if (!val && this._event.data && this._event.data[name]) {
            return this._event.data[name];
        } else return val;
    }

    async _callGameDataAccess(method, params) {
        let data = {
            jwt: this.jwt, 
            claims: this.claims, 
            plan: this.plan,
            method: method,
            credentials: {
                accessKeyId: this.event.requestContext.authorizer.accessKeyId, 
                secretAccessKey: this.event.requestContext.authorizer.secretAccessKey, 
                sessionToken: this.event.requestContext.authorizer.sessionToken, 
                identityId: this.event.requestContext.authorizer.identityId
            },
            params: params
        }
        
        let lambda = new this._aws.Lambda();
        let invokeParams = {
                FunctionName: "DOCAAS_DeckDataAccess",
                InvocationType: "RequestResponse",
                LogType: "Tail",
                Payload: JSON.stringify(data)
           };
        let result = await lambda.invoke(invokeParams).promise();
        console.log("DA Result:", result);
        return JSON.parse(result.Payload);
    }
  }
  
module.exports.Helper = Helper;