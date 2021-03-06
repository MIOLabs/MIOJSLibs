import { MIOObject, MIOURL, MIOURLRequest, MIOURLConnection, MIONotificationCenter } from "../MIOFoundation";

export enum MWSRequestType {
    Fetch,
    Save
}

export class MWSRequest extends MIOObject
{
    url:MIOURL = null;
    httpMethod = "GET"
    body = null;
    bodyData = null;    

    resultCode = 0
    resultData = null;

    type = MWSRequestType.Fetch;
    
    private urlRequest:MIOURLRequest = null;
    initWithURL(url:MIOURL, body?, httpMethod?:string){
        
        this.url = url;
        this.body = body;
        if (httpMethod != null) this.httpMethod = httpMethod;
    }

    private headers = {};
    setHeaderValue(value:string, key:string) {
        this.headers[key] = value;
    }

    // Completion block (Int, Any?) -> Void
    execute(target, completion?){
        
        MIONotificationCenter.defaultCenter().postNotification("MWSRequestSentFetch", this);
        this.willStart()

        this.urlRequest = MIOURLRequest.requestWithURL(this.url);      

        for (var key in this.headers) {
            let value = this.headers[key];
            this.urlRequest.setHeaderField(key, value);
        }    
        
        this.urlRequest.httpMethod = this.httpMethod;
        this.urlRequest.httpBody = this.bodyData;
        
        let con = new MIOURLConnection();
        con.initWithRequestBlock(this.urlRequest, this, function(code, data, blob){

            if (code < 200 || code >= 300) MIONotificationCenter.defaultCenter().postNotification("MWSRequestFetchError", this, {"Type" : this.type});
            this.resultCode = code;
            this.resultData = data;

            this.didFinish();

            if (completion != null){
                completion.call(target, code, this.resultData);
            }

            MIONotificationCenter.defaultCenter().postNotification("MWSRequestReceivedFetch", this);
        });
    }

     // For subclasing
    protected willStart(){}
    protected didFinish(){}
}