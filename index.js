'use strict';

const { Contract } = require('fabric-contract-api');

class DIDContract extends Contract {

    // Initialize the ledger
    async initLedger(ctx) {
        console.info('DID Chaincode initialized');
        return 'DID Chaincode initialized successfully';
    }

    // CreateDID - Anchor a new DID Document on Fabric
    async CreateDID(ctx, did, longFormDid, documentJSON) {
        console.info(`Creating DID: ${did}`);
        
        // Check if DID already exists
        const existingDID = await ctx.stub.getState(did);
        if (existingDID && existingDID.length > 0) {
            throw new Error(`DID ${did} already exists`);
        }

        // Create DID document object
        const didDocument = {
            did: did,
            longFormDid: longFormDid,
            document: JSON.parse(documentJSON),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };

        // Store DID document on ledger
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(didDocument)));
        
        console.info(`DID ${did} created successfully`);
        return JSON.stringify(didDocument);
    }

    // UpdateDID - Update DID Document (e.g., rotate keys, add services)
    async UpdateDID(ctx, did, updatedDocumentJSON, operationSignature) {
        console.info(`Updating DID: ${did}`);
        
        // Get existing DID document
        const existingDIDBytes = await ctx.stub.getState(did);
        if (!existingDIDBytes || existingDIDBytes.length === 0) {
            throw new Error(`DID ${did} does not exist`);
        }

        const existingDID = JSON.parse(existingDIDBytes.toString());
        
        // TODO: Validate operationSignature using updateKey
        // For now, we'll skip signature validation
        
        // Update DID document
        const updatedDID = {
            ...existingDID,
            document: JSON.parse(updatedDocumentJSON),
            updatedAt: new Date().toISOString(),
            version: existingDID.version + 1
        };

        // Store updated DID document
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(updatedDID)));
        
        console.info(`DID ${did} updated successfully`);
        return JSON.stringify(updatedDID);
    }

    // RecoverDID - Recover a lost DID (replace keys)
    async RecoverDID(ctx, did, newDocumentJSON, recoverySignature) {
        console.info(`Recovering DID: ${did}`);
        
        // Get existing DID document
        const existingDIDBytes = await ctx.stub.getState(did);
        if (!existingDIDBytes || existingDIDBytes.length === 0) {
            throw new Error(`DID ${did} does not exist`);
        }

        const existingDID = JSON.parse(existingDIDBytes.toString());
        
        // TODO: Validate recoverySignature using recovery key
        // For now, we'll skip signature validation
        
        // Recover DID document with new keys
        const recoveredDID = {
            ...existingDID,
            document: JSON.parse(newDocumentJSON),
            updatedAt: new Date().toISOString(),
            version: existingDID.version + 1,
            recovered: true,
            recoveredAt: new Date().toISOString()
        };

        // Store recovered DID document
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(recoveredDID)));
        
        console.info(`DID ${did} recovered successfully`);
        return JSON.stringify(recoveredDID);
    }

    // GetDID - Retrieve current DID Document
    async GetDID(ctx, did) {
        console.info(`Getting DID: ${did}`);
        
        const didBytes = await ctx.stub.getState(did);
        if (!didBytes || didBytes.length === 0) {
            throw new Error(`DID ${did} does not exist`);
        }

        const didDocument = JSON.parse(didBytes.toString());
        console.info(`DID ${did} retrieved successfully`);
        return JSON.stringify(didDocument);
    }

    // ListDIDs - List all DIDs in the ledger (with pagination)
    async ListDIDs(ctx, startKey = '', endKey = '') {
        console.info('Listing all DIDs');
        
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        const allResults = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                // Only return basic info for listing
                allResults.push({
                    did: record.did,
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                    version: record.version,
                    recovered: record.recovered || false
                });
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            result = await iterator.next();
        }
        
        await iterator.close();
        console.info(`Found ${allResults.length} DIDs`);
        return JSON.stringify(allResults);
    }

    // GetDIDHistory - Get transaction history for a DID
    async GetDIDHistory(ctx, did) {
        console.info(`Getting history for DID: ${did}`);
        
        const iterator = await ctx.stub.getHistoryForKey(did);
        const history = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const record = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                isDelete: result.value.isDelete,
                value: result.value.value.toString()
            };
            history.push(record);
            result = await iterator.next();
        }
        
        await iterator.close();
        console.info(`Found ${history.length} history records for DID ${did}`);
        return JSON.stringify(history);
    }
}

module.exports = DIDContract;