
/// <reference path="../MIOFoundation/MIOFoundation.ts" />

enum MIODeleteRule {
    noActionDeleteRule,
    nullifyDeleteRule,
    cascadeDeleteRule,
    denyDeleteRule
}

class MIORelationshipDescription extends MIOPropertyDescription
{
    destinationEntityName:string = null;
    destinationEntity:MIOEntityDescription = null;
    inverseRelationship:MIORelationshipDescription = null;
    isToMany = false;
    deleteRule = MIODeleteRule.noActionDeleteRule;

    private _serverName:string = null;

    initWithName(name:string, destinationEntityName:string, isToMany:boolean, serverName?:string, inverseName?:string, inverseEntity?:string){

        this.init();
        this.name = name;
        this.destinationEntityName = destinationEntityName;
        this.isToMany = isToMany;
        if (serverName != null)
            this._serverName = serverName;
        if (inverseName != null && inverseEntity != null){
            var ir = new MIORelationshipDescription();
            ir.initWithName(inverseName, inverseEntity, false);
            this.inverseRelationship = ir;
        }
    }

    get serverName(){
        if (this._serverName == null) {    
            return this.name;
        }
        
        return this._serverName;
    }
}