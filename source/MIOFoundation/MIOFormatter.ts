
/// <reference path="MIOObject.ts" />

class MIOFormatter extends MIOObject {

    stringForObjectValue(value) {
        return value;
    }

    getObjectValueForString(str:string) {

    }

    editingStringForObjectValue(value) {

    }

    isPartialStringValid(str:string):[boolean, string]{

        var newStr = "";
        
        return [false, newStr];
    }
}