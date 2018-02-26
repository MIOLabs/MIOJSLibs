
function MIOCoreStringHasPreffix(str, preffix)
{
    return str.substring( 0, preffix.length ) === preffix;
}

function MIOCoreStringHasSuffix(str, suffix)
{
    return str.match(suffix+"$")==suffix;
}

function MIOCoreStringAppendPathComponent(string:string, path):string
{
    var str = string;
    
    if (string.charAt(string.length - 2) != "/")
        str += "/";

    if (path.charAt(0) != "/")
        str += path;
    else
        str += path.substr(1);

    return str;
}

function MIOCoreStringLastPathComponent(string:string)
{
    let index = string.lastIndexOf("/");
    let len = string.length - index;
    var str = string.substr(index, len);

    return str;
}

function MIOCoreStringDeletingLastPathComponent(string:string)
{
    var index = string.lastIndexOf("/");
    var str = string.substr(0, index);

    return str;
}

function MIOCoreStringStandardizingPath(string)
{
    var array = string.split("/");

    var newArray = []; 
    var index = 0;
    for (var count = 0; count < array.length; count++)
    {
        var component:string = array[count];
        if (component.substr(0,2) == "..")
            index--;
        else 
        {
            newArray[index] = component;
            index++;
        }                
    }

    var str = "";
    if (index > 0)
        str = newArray[0];

    for (var count = 1; count < index; count++)
    {
        str += "/" + newArray[count];
    }

    return str;
}