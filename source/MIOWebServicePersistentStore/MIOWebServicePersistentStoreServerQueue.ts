
/// <reference path="../MIOFoundation/MIOFoundation.ts" />

/// <reference path="MWPSUploadOperation.ts" />

class MIOWebServicePersitentStoreServerQueue extends MIOObject {

    token = null;
    identifier = null;
    identifierType = null;

    dataSource = null;
    delegate = null;

    private maxDownloadLevel = 2;

    get referenceIDKey() { return this.delegate.referenceIDKey; }
    serverDeleteDateKey = "deletedAt";
    serverReferenceIDKey = "id";

    private url: MIOURL = null;
    private mom: MIOManagedObjectModel = null;

    private serverDateFormatter: MIOISO8601DateFormatter = null;

    private queries = {};
    private downloadingObjectsByReferenceID = {};

    private uploadOperationQueue: MIOOperationQueue = null;
    private operationsByReferenceID = {};

    initWithURL(url: MIOURL, mom: MIOManagedObjectModel) {
        super.init();
        this.url = url;
        this.mom = mom;

        this.serverDateFormatter = new MIOISO8601DateFormatter();
        this.serverDateFormatter.init();
    }
    
    private queryByID(queryID:string){
     
        var qID = queryID;
        var query = null;
        if (qID == null) {
            qID = MIOUUID.uuid();
            query = {};
            query["Count"] = 1;
            query["Level"] = 1;
            query["Inserted"] = {}
            query["Updated"] = {}
            query["Deleted"] = {}
            query["Objects"] = []
            this.queries[qID] = query;
        }

        return qID;
    }

    private incDownloadCountFromQueryID(queryID:string){

        let qID = this.queryByID(queryID);
        let query = this.queries[qID];
        query["Count"] = query["Count"] + 1;
    }

    queryCountByID(queryID:string){
        let query = this.queries[queryID];
        if (query == null) return 0;    
        else return query["Count"];
    }

    private checkQueryByID(queryID: string, context: MIOManagedObjectContext) {

        let query = this.queries[queryID];
        if (query == null) return;

        let count = query["Count"];
        if (count == 0) {
            // Notify the cahnges changes
            let inserted = query["Inserted"] ? query["Inserted"] : [];
            let updated = query["Updated"] ? query["Updated"] : [];
            let deleted = query["Deleted"] ? query["Deleted"] : [];
            this.delegate.queryDidFinish(inserted, updated, deleted, context);

            var objs = query["Objects"];
            for (var index = 0; index < objs.length; index++) {
                let o: MIOManagedObject = objs[index];
                let referenceID = o.primitiveValue(this.referenceIDKey);
                delete this.downloadingObjectsByReferenceID[referenceID];
            }

            let entityName = query["EntityName"];
            MIONotificationCenter.defaultCenter().postNotification('MIOWebServicePersistentStoreDidChangeEntityStatus', entityName, 'Ready');            

            delete this.queries[queryID];
        }
    }

    addInsertedObjectInQuery(queryID: string, obj: MIOManagedObject) {

        let query = this.queries[queryID];

        let entityName = obj.entity.managedObjectClassName;
        var entities = query["Inserted"];

        let ins_objs = entities[entityName];
        if (ins_objs == null) {
            ins_objs = [];
            entities[entityName] = ins_objs;
        }

        ins_objs.push(obj);

        var objs = query["Objects"];
        objs.push(obj);
    }

    addUpdatedObjectInQuery(queryID: string, obj: MIOManagedObject) {

        let query = this.queries[queryID];

        let entityName = obj.entity.managedObjectClassName;

        // Check if the object is already in the inserted cache
        var entities = query["Inserted"];
        var ins_obj = entities[entityName];
        if (ins_obj != null) {
            let index = ins_obj.indexOf(obj);
            if (index > -1) return;
        }

        entities = query["Updated"];
        var upd_objs = entities[entityName];
        if (upd_objs == null) {
            upd_objs = [];
            entities[entityName] = upd_objs;
        }

        let index = upd_objs.indexOf(obj)
        if (index > -1) return;

        // Add to update objects
        upd_objs.push(obj);
        var objs = query["Objects"];
        objs.push(obj);
    }

    addDeletedObjectInQuery(queryID: string, obj: MIOManagedObject) {

        // TODO:
        let query = this.queries[queryID];
        var del_objs = query["Deleted"];

        if (del_objs == null) {
            del_objs = [];
            query["Updated"] = del_objs;
        }

        let index = del_objs.indexOf(obj)
        if (index > -1) return;

        del_objs.push(obj);
    }

    private sendRequest(url: MIOURL, body, httpMethod: string, target?, completion?) {

        let request = MIOURLRequest.requestWithURL(url);

        // Setup headers
        if (this.token != null)
            request.setHeaderField("Authorization", "Bearer " + this.token);
        request.setHeaderField("Content-Type", "application/json");

        if (body != null){
            request.body = JSON.stringify(body);
        }
            
        request.httpMethod = httpMethod;

        var urlConnection = new MIOURLConnection();
        urlConnection.initWithRequestBlock(request, this, function (statusCode, data) {

            var json = null;
            var error = null;
            if (statusCode == 200) {
                if (data != null)
                    json = JSON.parse(data.replace(/(\r\n|\n|\r)/gm, ""));
            }
            else if (statusCode == 401) {
                error = { "Code": statusCode, "Error": "Invalid token. The user need to login again" };
                MIONotificationCenter.defaultCenter().postNotification("MIOWebServiceError", error);
            }
            else if (statusCode == 422) {
                error = { "Code": statusCode, "Error": "Unprocessable Entity. Check the value of the parameters you send it" };
                MIONotificationCenter.defaultCenter().postNotification("MIOWebServiceError", error);
            }
            else {
                error = { "Code": statusCode, "Error": "Conection error. Check internet and server status" };
                MIONotificationCenter.defaultCenter().postNotification("MIOWebServiceError", error);
            }

            if (error != null) {
                console.log("MIOWebserice: " + request.httpMethod + ": " + request.url.absoluteString);
                console.log("MIOWebserice: Error " + error["Code"] + ". " + error["Error"]);
                console.log("MIOWebserice: Body: " + request.body);
            }

            completion.call(target, statusCode, json);
        });
    }

    private fetchOnSever(url: MIOURL, body, httpMethod: string, referenceID: string, entityName: string, queryID: string, level, context: MIOManagedObjectContext) {

        // Create query to keep track the objects
        var qID = queryID;
        var query = null;
        if (qID == null) {
            qID = MIOUUID.uuid();
            query = {};
            query["Count"] = 1;
            query["Inserted"] = {};
            query["Updated"] = {};
            query["Deleted"] = {};
            query["Objects"] = [];
            query["EntityName"] = entityName;
            this.queries[qID] = query;

            MIONotificationCenter.defaultCenter().postNotification('MIOWebServicePersistentStoreDidChangeEntityStatus', entityName, 'Downloading');
        }
        else {
            query = this.queries[queryID];
            query["Count"] = query["Count"] + 1;
        }
                
        let lvl = level + 1;

        // NO, so we can start ask to the server
        this.sendRequest(url, body, httpMethod, this, function (code, json) {

            if (code == 200) {
                // Check entity timestamp
                // let ts1 = entity["Timestamp"] ? entity["Timestamp"] : 0;
                let ts2 = json["lastupdate"];
                // if (ts1 >= ts2) return;

                // Convert to an array in case of fetch by reference ID
                let items = referenceID ? [json["data"]] : json["data"];
                this.parseServerObjectsForEntity(entityName, items, qID, lvl, context);
            }
            else {
                // The object is deleted
                if (typeof this.delegate.serverQueuefetchObjectDidFail === "function") {
                    this.delegate.serverQueuefetchObjectDidFail(code, referenceID, entityName);
                }
            }

            let query = this.queries[qID];
            query["Count"] = query["Count"] - 1;
            this.checkQueryByID(qID, context);
        });
    }

    fetchObjectsOnServer(request:MIOFetchRequest, predicate: MIOPredicate, context: MIOManagedObjectContext) {

        var result = this.delegate.canServerSyncEntityNameForType(request.entityName, MIOWebServicePersistentIgnoreEntityType.Query);
        if (result == false) return;

        var p: MIOPredicate = this.delegate.predicateFetchOnServerForEntityName(request.entityName, predicate);

        let url = this.url.urlByAppendingPathComponent("/" + this.identifierType + "/" + this.identifier + "/" + request.entityName.toLocaleLowerCase());
        var body = null;
        var httpMethod = "GET";

        if (p != null) {
            let ed: MIOEntityDescription = this.mom.entitiesByName[request.entityName];
            let filters = this.parsePredictates(p.predicateGroup.predicates, ed);

            body = {};
            body = { "where": filters };
            httpMethod = "POST";
        }

        if (request.fetchLimit > 0) {
            httpMethod = "POST";
            if (body == null) body = {};
            body["limit"] = request.fetchLimit;
        }

        this.fetchOnSever(url, body, httpMethod, null, request.entityName, null, 0, context);
    }

    fetchObjectOnServerByReferenceID(referenceID: string, entityName: string, queryID: string, level, context: MIOManagedObjectContext) {

        var result = this.delegate.canServerSyncEntityNameForType(entityName, MIOWebServicePersistentIgnoreEntityType.Query);
        if (result == false) return;

        let url = this.url.urlByAppendingPathComponent("/" + this.identifierType + "/" + this.identifier + "/" + entityName.toLocaleLowerCase() + "/" + referenceID.toUpperCase());
        var body = null;
        var httpMethod = "GET";

        this.fetchOnSever(url, body, httpMethod, referenceID, entityName, queryID, level, context);
    }

    private fetchObjectByReferenceID(referenceID: string, entityName: string, queryID: string, level, context: MIOManagedObjectContext) {

        var obj = this.downloadingObjectsByReferenceID[referenceID];
        if (obj != null) return obj;

        // From persistent store
        var obj = this.delegate.objectByReferenceID(referenceID);
        if (obj == null) {
            obj = this.delegate.newObjectWithReferenceID(referenceID, entityName, context);
            if (level < this.maxDownloadLevel) this.addInsertedObjectInQuery(queryID, obj);
        }
        
        if (level < this.maxDownloadLevel) {
            this.downloadingObjectsByReferenceID[referenceID] = obj;
            this.fetchObjectOnServerByReferenceID(referenceID, entityName, queryID, level, context);
        }

        return obj;
    }

    private parsePredictates(predicates, entity: MIOEntityDescription) {

        var result = [];

        for (var count = 0; count < predicates.length; count++) {
            var o = predicates[count];

            if (o instanceof MIOPredicateGroup) {
                let group = o as MIOPredicateGroup;
                let i = {};
                i["type"] = "group";
                i["values"] = this.parsePredictates(group.predicates, entity);
                result.push(i);
            }
            else if (o instanceof MIOPredicateItem) {
                //result = o.evaluateObject(object);
                let item = o as MIOPredicateItem;
                let mapItemPredicateFormat = this.delegate.filterServerAttributeKey(entity.managedObjectClassName, item.key, item.value, item.comparator);
                if (mapItemPredicateFormat == null) {
                    let i = {};
                    i["type"] = "item";
                    this.transformPredicateItem(i, item, entity);
                    result.push(i);
                } else {
                    let p = MIOPredicate.predicateWithFormat(mapItemPredicateFormat);
                    let group: MIOPredicateGroup = p.predicateGroup;
                    let i = {};
                    i["type"] = "group";
                    i["values"] = this.parsePredictates(group.predicates, entity);
                    result.push(i);
                }
            }
            else if (o instanceof MIOPredicateOperator) {
                let op = o as MIOPredicateOperator;
                let i = {};
                i["type"] = "operator";
                i["value"] = this.transfromPredicateOperator(op.type);
                result.push(i)
            }
        }

        return result;
    }

    private transformPredicateItem(i, item, entity) {

        let value = item.value;
        let cmp = item.comparator;

        i["key"] = this.transformPredicateKey(item, entity);

        if (cmp.Equal && value == null) {
            i["comparator"] = "is null";
        }
        else if (cmp.Distinct && value == null) {
            i["comparator"] = "not null";
        }
        else {
            i["comparator"] = this.transfromPredicateComparator(item.comparator);
            i["value"] = item.value;
        }
    }

    private transformPredicateKey(item, entity: MIOEntityDescription) {

        var serverKey = null
        // Check server relationship        
        let keys = item.key.split('.');

        if (keys > 2) {
            throw ("MIOWebServicePersistentStore: It's not supported a key path with more than 2 keys.");
        }

        if (keys.length == 1) {
            serverKey = entity.serverAttributeName(item.key);
        }
        else if (keys.length == 2) {
            let relKey = keys[0];
            let key = keys[1];

            if (key == this.referenceIDKey) {
                serverKey = entity.serverRelationshipName(relKey);
            }
        }

        if (serverKey == null) {
            throw ("MIOWebServicePersistentStore: Attribute or Relationship server key is invalid.");
        }

        return serverKey;
    }

    private transfromPredicateComparator(cmp): string {

        switch (cmp) {

            case MIOPredicateComparatorType.Equal:
                return "=";

            case MIOPredicateComparatorType.Less:
                return "<";

            case MIOPredicateComparatorType.LessOrEqual:
                return "<=";

            case MIOPredicateComparatorType.Greater:
                return ">";

            case MIOPredicateComparatorType.GreaterOrEqual:
                return ">=";

            case MIOPredicateComparatorType.Distinct:
                return "!=";

            case MIOPredicateComparatorType.Contains:
                return "like";

            case MIOPredicateComparatorType.NotContains:
                return "not like";
        }

        return "";
    }

    private transfromPredicateOperator(op): string {

        switch (op) {

            case MIOPredicateOperatorType.AND:
                return "and";

            case MIOPredicateOperatorType.OR:
                return "or";
        }

        return "";
    }

    //
    // Server objects -> Managed objects
    //

    private parseServerObjectsForEntity(entityName: string, items, queryID: string, level, context: MIOManagedObjectContext) {

        let ed: MIOEntityDescription = this.mom.entitiesByName[entityName];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            let referenceID = item[this.serverReferenceIDKey].toUpperCase();
            var mo: MIOManagedObject = this.downloadingObjectsByReferenceID[referenceID];
            if (mo == null) {
                mo = this.delegate.objectByReferenceID(referenceID);
            }

            if (mo == null) {
                mo = this.delegate.newObjectWithReferenceID(referenceID, entityName, context);
                this.downloadingObjectsByReferenceID[referenceID] = mo;
                // We parse the attrbitues and relationships from the sever
                this.parseAttributes(ed.attributes, item, mo);
                this.parseRelationships(ed.relationships, item, mo, queryID, level);
                this.addInsertedObjectInQuery(queryID, mo);
                MIONotificationCenter.defaultCenter().postNotification("MIOWebServicePersistentStoreEntityDownloaded", mo, "Inserted");
            }
            else {
                let ts1 = mo.valueForKey("updatedAt");
                let ts2 = item["updatedAt"];

                if (ts2 == null) throw ("MIOWebServicePersistentStore: UpdateAt field from server is null");

                if (ts1 != ts2) {
                    this.addUpdatedObjectInQuery(queryID, mo);
                    this.parseAttributes(ed.attributes, item, mo);
                    this.parseRelationships(ed.relationships, item, mo, queryID, level);
                    MIONotificationCenter.defaultCenter().postNotification("MIOWebServicePersistentStoreEntityDownloaded", mo, "Updated");
                }
            }
        }
    }

    private parseAttributes(attributes, item, mo: MIOManagedObject) {

        for (var i = 0; i < attributes.length; i++) {
            let attr: MIOAttributeDescription = attributes[i];
            this.parseValueForAttribute(attr, item[attr.serverName], mo);
        }
    }

    private parseValueForAttribute(attribute: MIOAttributeDescription, value, object:MIOManagedObject) {

        // Ignore server id attribute. We take care in other side of the code
        if (attribute.serverName == this.serverReferenceIDKey) return;

        if (value == null && attribute.optional == false) {
            throw ("MIOWebPersistentStore: Couldn't set attribute value (" + object.className + "." + attribute.name + "). Value is nil and it's not optional.");
        }

        if (value == null) return;
        let type = attribute.attributeType;

        object.willChangeValue(attribute.name);
        if (type == MIOAttributeType.Boolean) {
            if (typeof (value) === "boolean") {
                object.setPrimitiveValue(attribute.name, value);
            }
            else if (typeof (value) === "string") {
                let lwValue = value.toLocaleLowerCase();
                if (lwValue == "yes" || lwValue == "true" || lwValue == "1")
                    object.setPrimitiveValue(attribute.name, true);
                else
                    object.setPrimitiveValue(attribute.name, false);
            }
            else {
                let v = value > 0 ? true : false;
                object.setPrimitiveValue(attribute.name, v);
            }
        }
        else if (type == MIOAttributeType.Integer) {
            object.setPrimitiveValue(attribute.name, parseInt(value));
        }
        else if (type == MIOAttributeType.Float || type == MIOAttributeType.Number) {
            object.setPrimitiveValue(attribute.name, parseFloat(value));
        }
        else if (type == MIOAttributeType.String) {
            object.setPrimitiveValue(attribute.name, value);
        }
        else if (type == MIOAttributeType.Date) {
            object.setPrimitiveValue(attribute.name, this.serverDateFormatter.dateFromString(value));
        }
        object.didChangeValue(attribute.name);
    }

    private parseRelationships(relationships, item, mo: MIOManagedObject, queryID: string, level) {

        for (var i = 0; i < relationships.length; i++) {
            let rel: MIORelationshipDescription = relationships[i];

            if (rel.isToMany == false) {

                // spected object
                let referenceID: string = item[rel.serverName];
                if (referenceID == null) continue;

                let obj: MIOManagedObject = this.fetchObjectByReferenceID(referenceID, rel.destinationEntityName, queryID, level, mo.managedObjectContext);
                mo.willChangeValue(rel.name);
                mo.setPrimitiveValue(rel.name, obj);
                mo.didChangeValue(rel.name);
            }
            else {

                let ids = item[rel.serverName];
                if (ids == null) continue;

                for (var j = 0; j < ids.length; j++) {

                    let referenceID: string = ids[j];
                    if (referenceID == null) continue;

                    let obj: MIOManagedObject = this.fetchObjectByReferenceID(referenceID, rel.destinationEntityName, queryID, level, mo.managedObjectContext);
                    let values: MIOSet = mo.primitiveValue(rel.name);
                    values.addObject(obj);
                }
            }
        }
    }

    //
    // App to server comunication
    //

    checkOperationDependecies(operation: MWPSUploadOperation, dependencies) {

        for (var index = 0; index < dependencies.length; index++) {
            let referenceID = dependencies[index];
            let op = this.operationsByReferenceID[referenceID];
            if (op == null) continue;
            operation.addDependency(op);
        }
    }

    uploadToServer() {

        if (this.uploadOperationQueue == null) {
            this.uploadOperationQueue = new MIOOperationQueue();
            this.uploadOperationQueue.init();
        }

        for (var refID in this.operationsByReferenceID) {
            let op = this.operationsByReferenceID[refID];
            this.checkOperationDependecies(op, op.dependencyIDs);
            this.uploadOperationQueue.addOperation(op);
        }
    }

    insertObjectToServer(obj: MIOManagedObject) {

        let referenceID = obj.valueForKey(this.referenceIDKey);
        if (referenceID == null) return;

        let entityName = obj.entity.managedObjectClassName;
        var result = this.delegate.canServerSyncEntityNameForType(entityName, MIOWebServicePersistentIgnoreEntityType.Insert);
        if (result == false) return;

        var dependencies = [];

        var op = new MWPSUploadOperation();
        op.initWithDelegate(this);
        op.url = this.url.urlByAppendingPathComponent("/" + this.identifierType + "/" + this.identifier + "/" + entityName.toLocaleLowerCase());
        op.httpMethod = "PUT"
        op.body = this.serverDataFromObject(obj, false, dependencies);
        op.dependencyIDs = dependencies;

        this.operationsByReferenceID[referenceID] = op;

        op.target = this;
        op.completion = function () {
            delete this.operationsByReferenceID[referenceID];

            let item = op.responseJSON["data"];
            let queryID = this.queryByID(null);
            this.parseServerObjectsForEntity(entityName, [item], queryID, obj.managedObjectContext);
            let query = this.queries[queryID];
            query["Count"] = query["Count"] - 1;
            this.checkQueryByID(queryID, obj.managedObjectContext);
        }
    }

    updateObjectOnServer(obj: MIOManagedObject) {

        let referenceID = obj.valueForKey(this.referenceIDKey);
        if (referenceID == null) return;

        let entityName = obj.entity.managedObjectClassName;
        var result = this.delegate.canServerSyncEntityNameForType(entityName, MIOWebServicePersistentIgnoreEntityType.Update);
        if (result == false) return;

        var dependencies = [];

        var op = new MWPSUploadOperation();
        op.initWithDelegate(this);
        op.url = this.url.urlByAppendingPathComponent("/" + this.identifierType + "/" + this.identifier + "/" + entityName.toLocaleLowerCase() + "/" + referenceID);
        op.httpMethod = "PATCH"
        op.body = this.serverDataFromObject(obj, true, dependencies);
        op.dependencyIDs = dependencies;

        this.operationsByReferenceID[referenceID] = op;

        op.target = this;
        op.completion = function () {
            delete this.operationsByReferenceID[referenceID];
        }
    }

    deleteObjectOnServer(obj: MIOManagedObject) {

        let referenceID = obj.valueForKey(this.referenceIDKey);
        if (referenceID == null) return;

        let entityName = obj.entity.managedObjectClassName;
        var result = this.delegate.canServerSyncEntityNameForType(entityName, MIOWebServicePersistentIgnoreEntityType.Delete);
        if (result == false) return;


        var dependencies = [];

        var op = new MWPSUploadOperation();
        op.initWithDelegate(this);
        op.url = this.url.urlByAppendingPathComponent("/" + this.identifierType + "/" + this.identifier + "/" + entityName.toLocaleLowerCase() + "/" + referenceID.toUpperCase());
        op.httpMethod = "DELETE"
        //op.body = null; 
        this.serverDataFromObject(obj, false, dependencies);
        op.dependencyIDs = dependencies;

        this.operationsByReferenceID[referenceID] = op;

        op.target = this;
        op.completion = function () {
            delete this.operationsByReferenceID[referenceID];
        }
    }

    //
    // Managed Objects -> Server objects
    //
    private serverDataFromObject(obj: MIOManagedObject, onlyChanges:boolean, dependencies) {

        let entityName = obj.entity.managedObjectClassName;
        let ed: MIOEntityDescription = this.mom.entitiesByName[entityName];

        var changedKeys = null;
        if (onlyChanges == true){
            changedKeys = [];
            let changedValues = obj.changedValues;
            for (var key in changedValues){
                changedKeys.push(key);
            }
        }

        let item = {};

        let referenceID = obj.valueForKey(this.referenceIDKey);
        if (referenceID == null) throw ('MIOWebService: Object without referenceID');
        item[this.serverReferenceIDKey] = referenceID.toUpperCase();
        this.serverAttributes(ed.attributes, item, obj, changedKeys);
        this.serverRelationships(ed.relationships, item, obj, changedKeys, dependencies);

        return item;
    }

    private serverAttributes(attributes, item, mo: MIOManagedObject, changedKeys) {

        for (var i = 0; i < attributes.length; i++) {
            let attr: MIOAttributeDescription = attributes[i];
            this.serverValueForAttribute(attr, attr.serverName, item, mo, changedKeys);
        }
    }

    private serverValueForAttribute(attribute: MIOAttributeDescription, servername, item, object, changedKeys) {

        if (attribute.name == this.referenceIDKey) return;

        if (attribute.syncable == false) return;

        if (changedKeys != null && changedKeys.indexOf(attribute.name) == -1) return;

        let value = object.valueForKey(attribute.name);

        if (value == null && attribute.optional == false) {
            throw ("MIOWebPersistentStore: Couldn't set attribute value. Value is nil and it's not optional.");
        }

        if (value == null) return;

        let type = attribute.attributeType;
        if (type == MIOAttributeType.Date) {
            item[servername] = this.serverDateFormatter.stringFromDate(value);
        }
        else {
            item[servername] = value;
        }
    }

    private serverRelationships(relationships, item, mo: MIOManagedObject, changedKeys, dependencies) {

        for (var i = 0; i < relationships.length; i++) {
            let rel: MIORelationshipDescription = relationships[i];

            if (changedKeys != null && changedKeys.indexOf(rel.name) == -1) continue;

            if (rel.isToMany == false) {

                // Expected object
                let obj: MIOManagedObject = mo.valueForKey(rel.name);
                if (obj == null) continue;

                let referenceID = obj.valueForKey(this.referenceIDKey);
                item[rel.serverName] = referenceID;
                if (rel.inverseRelationship == null)
                    dependencies.push(referenceID);
            }
            else {

                let objects: MIOSet = mo.valueForKey(rel.serverName);
                if (objects == null) continue;

                var array = [];
                for (var index = 0; index < objects.length; index++) {

                    let obj:MIOManagedObject = objects.objectAtIndex(index);
                    let referenceID = obj.valueForKey(this.referenceIDKey);
                    
                    array.push(referenceID);
                    if (rel.inverseRelationship == null)
                        dependencies.push(referenceID);
                }

                item[rel.serverName] = array;
            }
        }
    }
}