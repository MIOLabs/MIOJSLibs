import { MIOPropertyDescription } from "./MIOPropertyDescription";
import { MIOEntityDescription } from "./MIOEntityDescription";

export enum MIODeleteRule {
    noActionDeleteRule,
    nullifyDeleteRule,
    cascadeDeleteRule,
    denyDeleteRule
}

export class MIORelationshipDescription extends MIOPropertyDescription
{
    destinationEntityName:string = null;
    destinationEntity:MIOEntityDescription = null;
    inverseRelationship:MIORelationshipDescription = null;
    isToMany = false;
    deleteRule = MIODeleteRule.noActionDeleteRule;

    private _serverName:string = null;

    initWithName(name:string, destinationEntityName:string, isToMany:boolean, serverName?:string, inverseName?:string, inverseEntityName?:string){

        this.init();
        this.name = name;
        this.destinationEntityName = destinationEntityName;
        this.isToMany = isToMany;
        if (serverName != null)
            this._serverName = serverName;
        if (inverseName != null && inverseEntityName != null){
            let ir = new MIORelationshipDescription();
            ir.initWithName(inverseName, inverseEntityName, false); 
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