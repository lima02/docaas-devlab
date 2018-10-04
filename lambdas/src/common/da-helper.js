const identityPool = process.env.IDENTITY_POOL_ID || 'ap-southeast-2:5b205dba-4e2f-4382-abf3-907d6eb119eb';

class DAHelper {
    constructor(event) {
        this._event = event;
    }

    get event() {
      return this._event;
    }

    get method() {
        return this.event.method;
    }

    get params() {
        return this.event.params;
    }

    get dynamoDbClient() {
        return new this._aws.DynamoDB();
    }

    get jwt() {
        return this.event.jwt;
    }

    get claims() {
        return this.event.claims;
    }

    get plan() {
        return this.event.plan;
    }

    get role() {
        return this.claims["cognito:preferred_role"];
    }

    async getDeck(name) {
        return getDeck(this.dynamoDbClient, this._identityId, name);
    }
    async saveDeck(deck) {
        return saveDeck(this.dynamoDbClient, this._identityId, deck);
    }
    async createDeck(name) {
        return createDeck(this.dynamoDbClient, this._identityId, name);
    }

    async aquireCredentials() {
        this._aws = require('aws-sdk');
        this._aws.config.region = process.env.AWS_REGION || "ap-southeast-2";

        this._creds = await loadCredentials(this._aws, this._claims, this._jwt);
        if (!this._creds) {
            if (debugLogging) console.log("Failed to load credentials");
            return false;
        } else if (debugLogging) console.log("Retrieved Credentials:", this._creds);
    
        this._identityId = this._creds.id;
        return true;
    }
  }
  
module.exports.Helper = Helper;
  



async function loadCredentials(AWS, claims, idJWT) {
    return new Promise( async (resolve, reject) => {
        // Grab the PoolID from the issuer
        let pool = claims.iss.substring(8);
        // And setup the logins object with the ID Token for the pool
        let logins = {};
        logins[pool] = idJWT;

        // Retrieve the IdentityID (required for knowing how to query the DDB!)
        let id = await getIdentityId(AWS, logins);

        // Configure AWS to use the CognitoIdentityCredentials
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: identityPool,
            IdentityId: id, 
            Logins: logins
        });

        // And then, explicitly obtain the Credentials...
        AWS.config.credentials.get(function(){
            var accessKeyId = AWS.config.credentials.accessKeyId;
            var secretAccessKey = AWS.config.credentials.secretAccessKey;
            var sessionToken = AWS.config.credentials.sessionToken;
            resolve({ accessKeyId, secretAccessKey, sessionToken, id } );   // Returning the Credentials + Identity ID
        });        
    });
}

async function getIdentityId(AWS, logins) {
    const cognitoidentity = new AWS.CognitoIdentity();
    let idParams = {
        IdentityPoolId: identityPool, 
        Logins: logins
    };
    return cognitoidentity.getId(idParams).promise()
            .then( identity => {
                return identity.IdentityId;
            });
}