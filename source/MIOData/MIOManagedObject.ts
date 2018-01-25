/**
 * Created by godshadow on 23/03/2017.
 */

/// <reference path="../MIOFoundation/MIOFoundation.ts" />

/// <reference path="MIOEntityDescription.ts" />
/// <reference path="MIOFetchRequest.ts" />

/// <reference path="MIOManagedObjectID.ts" />

class MIOManagedObject extends MIOObject {        

    init(){
        throw("MIOManagedObject: Can't initialize an MIOManagedObject with -init");
    }

    _initWithObjectID(objectID:MIOManagedObjectID, context:MIOManagedObjectContext) {

        //super.init();
        this._objectID = objectID;
        this._managedObjectContext = context;
        this._isFault = true;
        this._storedValues = null;

        this.awakeFromFetch();

        //this.setDefaultValues();
        MIOLog("ManagedObject create: " + this.entity.name + "/" + this.objectID._getReferenceObject());
    }

    initWithEntityAndInsertIntoManagedObjectContext(entity:MIOEntityDescription, context:MIOManagedObjectContext){        
        
        let objectID = MIOManagedObjectID._objectIDWithEntity(entity);
        this._initWithObjectID(objectID, context);

        context.insertObject(this);        
        this.setDefaultValues();

        this.awakeFromInsert();

        MIOLog("ManagedObject ins create: " + this.entity.name + "/" + this.objectID._getReferenceObject());                  
    }

    private setDefaultValues(){
        let attributes = this.entity.attributesByName;
        for(var key in attributes) {
            let attr = attributes[key];
            let value = attr.defaultValue;

            if (value == null) continue;

            this.setValueForKey(value, key);
        }
    }
    
    private _objectID:MIOManagedObjectID = null;    
    get objectID():MIOManagedObjectID {return this._objectID;}
    get entity():MIOEntityDescription {return this.objectID.entity;}

    private _managedObjectContext:MIOManagedObjectContext = null;
    get managedObjectContext():MIOManagedObjectContext {return this._managedObjectContext;}

    get hasChanges():boolean {return (this._isInserted || this._isUpdated || this._isDeleted);}

    private _isInserted = false;
    get isInserted():boolean {return this._isInserted;}
    _setIsInserted(value:boolean) {
        this.willChangeValue("hasChanges");
        this.willChangeValue("isInserted");
        this._isInserted = value;
        this.didChangeValue("isInserted");
        this.didChangeValue("hasChanges");
    }    

    private _isUpdated = false;
    get isUpdated():boolean {return this._isUpdated;}
    _setIsUpdated(value:boolean) {
        this.willChangeValue("hasChanges");
        this.willChangeValue("isUpdated");
        this._isUpdated = value;
        this.didChangeValue("isUpdated");
        this.didChangeValue("hasChanges");
    }
    
    private _isDeleted = false;
    get isDeleted():boolean {return this._isDeleted;}
    _setIsDeleted(value:boolean) {
        this.willChangeValue("hasChanges");
        this.willChangeValue("isDeleted");
        this._isDeleted = value;
        this.didChangeValue("isDeleted");
        this.didChangeValue("hasChanges");
    }
    
    private _isFault = false;
    get isFault():boolean {return this._isFault;}
    _setIsFault(value:boolean) {
        if (value == this._isFault) return;
        this.willChangeValue("hasChanges");
        this.willChangeValue("isFault");
        this._isFault = value;
        if (value == true) this._storedValues = null;
        this.didChangeValue("isFault");
        this.didChangeValue("hasChanges");
    }    
        
    awakeFromInsert() {}
    awakeFromFetch() {}

    _version = -1;

    private _changedValues = {}; 
    get changedValues() {return this._changedValues;} 

    private _storedValues = null;
    private committedValues(){
        if (this.objectID.isTemporaryID == true) return {};

        if (this._storedValues == null) {
            // Get from the store
            if (this.objectID.persistentStore instanceof MIOIncrementalStore) {
                this._storedValues = this.storeValuesFromIncrementalStore(this.objectID.persistentStore);
            }
            else{
                throw("MIOManagedObject: Only Incremental store is supported.");
            }
            this._setIsFault(false);
        }

        return this._storedValues;
    }

    private storeValuesFromIncrementalStore(store:MIOIncrementalStore){
        
        var storedValues = {};
        
        let properties = this.entity.properties;
        
        for(let index = 0; index < properties.length; index++){
            let property = properties[index];
            if (property instanceof MIOAttributeDescription) {
                let attribute = property as MIOAttributeDescription;
                let node = store.newValuesForObjectWithID(this.objectID, this.managedObjectContext);
                let value = node.valueForPropertyDescription(attribute);                
                storedValues[attribute.name] = value;
            }
            else if (property instanceof MIORelationshipDescription) {
                let relationship = property as MIORelationshipDescription;                
                if (relationship.isToMany == false) {                    
                    var objectID = store.newValueForRelationship(relationship, this.objectID, this.managedObjectContext);
                    if (objectID != null){                    
                        let value = this.managedObjectContext.objectWithID(objectID);
                        storedValues[relationship.name] = value;
                    }                        
                }
                else {
                    // Trick. I store the set in the managed object intead of dynamic
                    let set = this["_" + relationship.name];
                    set.removeAllObjects();
                    storedValues[relationship.name] = set;
                    let objectIDs = store.newValueForRelationship(relationship, this.objectID, this.managedObjectContext);
                    if (objectIDs == null) continue;
                    
                    for(let index = 0; index < objectIDs.length; index++){
                        let objID = objectIDs[index];
                        let obj = this._managedObjectContext.objectWithID(objID);
                        set.addObject(obj);
                    }                                            
                }
            }
        } 
        
        return storedValues;
    }

    committedValuesForKeys(keys){

        let values = this.committedValues();
        if (keys == null) return values;

        var result = {};
        for (var key in keys){
            let obj = values[key];
            if (obj != null) result[key] = obj;
        }

        return result;
    }

    willSave() {}
    didSave() {}

    willTurnIntoFault() {}
    didTurnIntoFault() {}

    willAccessValueForKey(key:string) {};
    didAccessValueForKey(key:string) {};

    private _attributeValueForKey(key:string){
        this.willAccessValueForKey(key);        
        var value = this._changedValues[key];
        if (value == null) {
            let committedValues = this.committedValues();
            value = committedValues[key];
        }        
        this.didAccessValueForKey(key);

        return value;
    }

    valueForKey(key:string){
        if (key == null) return null;

        let property = this.entity.propertiesByName[key];
        if (property == null) {      
            return super.valueForKey(key);
        }      
        
        if (property instanceof MIORelationshipDescription) {
            let relationship = property as MIORelationshipDescription;
            if (relationship.isToMany == true){
                let value = this._attributeValueForKey(key);
                if (value == null) value = this["_" + key];
                return value;
            }
        }

        return this._attributeValueForKey(key);
    }

    setValueForKey(value, key:string){

        let property = this.entity.propertiesByName[key];

        if (property == null) {
            super.setValueForKey(value, key);
            return;
        }

        this.willChangeValueForKey(key);
        if (property instanceof MIOAttributeDescription){            
            if (value == null) delete this._changedValues[key];
            else this._changedValues[key] = value;
        }
        else if (property instanceof MIORelationshipDescription){
            let relationship = property as MIORelationshipDescription;
            let inverseRelationship = relationship.inverseRelationship;

            if (value == null) delete this._changedValues[key];
            else this._changedValues[key] = value;              

            if (inverseRelationship != null) {
                // TODO:
            }
        }
        this.didChangeValueForKey(key);        

        this.managedObjectContext.updateObject(this);
    }

    primitiveValueForKey(key:string){
        let committedValues = this.committedValues();
        let value = committedValues[key];
        return value;
    }

    setPrimitiveValueForKey(value, key:string){
        let committedValues = this.committedValues();        
        committedValues[key] = value;
    }

    _addObjectForKey(object, key:string){
        var set = this.valueForKey(key);
        if (set == null) set = MIOSet.set();
        set.addObject(object);
        this._changedValues[key] = set;
        this.managedObjectContext.updateObject(this);
    }

    _removeObjectForKey(object, key:string){
        var set = this.valueForKey(key);
        if (set == null) set = MIOSet.set();        
        else set.removeObject(object);
        this._changedValues[key] = set;
        this.managedObjectContext.updateObject(this);
    }
    
    _didCommit(){
        this._changedValues = {};
        this._storedValues = null;
        this._setIsFault(false);
    }

}
