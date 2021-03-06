//Implemented in: MIOCore/MIOArray.ts
declare interface Array<T> {
    addObject(object);
    insertObjectAtIndex(object, index);
    removeObject(object);
    removeObjectAtIndex(index);
    objectAtIndex(index);
    indexOfObject(object);
    containsObject(object):boolean;
    count();
    firstObject();
    lastObject();
}

//Implemented in: MIOCore/MIOString.ts
declare interface String {
    stringByAppendingPathComponent(path:string):string;
    stringByDeletingLastPathComponent():string;

    lastPathComponent():string;   
    pathExtension():string;     

    hasPreffix(preffix:string):boolean;
    hasSuffix(suffix:string):boolean;
}