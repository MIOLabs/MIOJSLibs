import { MIOCoreLexer } from "../MIOCore";

/**
 * Created by godshadow on 11/3/16.
 */

export enum MIODateFirstWeekDay{
    Sunday,
    Monday
}

var _MIODateFirstWeekDay = MIODateFirstWeekDay.Monday;
var _MIODateStringDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var _MIODateStringMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function MIODateSetFirstWeekDay(day:MIODateFirstWeekDay){

    _MIODateFirstWeekDay = day;
    if (day == MIODateFirstWeekDay.Sunday)
        _MIODateStringDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    else
        _MIODateStringDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
}

export function MIODateGetStringForMonth(month)
{
    return _MIODateStringMonths[month];
}

export function MIODateGetStringForDay(day:number)
{
    return _MIODateStringDays[day];
}

export function MIODateGetDayFromDate(date) 
{
    if (_MIODateFirstWeekDay == MIODateFirstWeekDay.Sunday) return date.getDay();    

    // Transform to start on Monday instead of Sunday
    // 0 - Mon, 1 - Tue, 2 - Wed, 3 - Thu, 4 - Fri, 5 - Sat, 6 - Sun
    let day = date.getDay();
    if (day == 0)
        day = 6;
    else
        day--;

    return day;
}

export function MIODateGetMonthFromDate(date:Date)
{
    return date.getMonth();
}

export function MIODateGetYearFromDate(date:Date)
{
    return date.getFullYear();
}

export function MIODateGetDayStringFromDate(date) 
{
    var day = MIODateGetDayFromDate(date);
    return MIODateGetStringForDay(day);
}

export function MIODateGetString(date)
{
    var d = MIODateGetDateString(date);
    var t = MIODateGetTimeString(date);

    return d + " " + t;
}

export function MIODateGetDateString(date)
{
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();
    return yyyy + "-" +(mm[1]?mm:"0"+mm[0]) + "-" +  (dd[1]?dd:"0"+dd[0]); // padding
}

export function MIODateGetTimeString(date)
{
    var hh = date.getHours().toString();
    var mm = date.getMinutes().toString();
    return (hh[1]?hh:"0"+hh[0]) + ":" + (mm[1]?mm:"0"+mm[0]);
}

export function MIODateGetUTCString(date)
{
    var d = MIODateGetUTCDateString(date);
    var t = MIODateGetUTCTimeString(date);

    return d + " " + t;
}

export function MIODateGetUTCDateString(date)
{
    var yyyy = date.getUTCFullYear().toString();
    var mm = (date.getUTCMonth()+1).toString(); // getMonth() is zero-based
    var dd  = date.getUTCDate().toString();
    return yyyy + "-" +(mm[1]?mm:"0"+mm[0]) + "-" +  (dd[1]?dd:"0"+dd[0]); // padding
}

export function MIODateGetUTCTimeString(date)
{
    var hh = date.getUTCHours().toString();
    var mm = date.getUTCMinutes().toString();
    var ss = date.getUTCSeconds().toString();
    return (hh[1]?hh:"0" + hh[0]) + ":" + (mm[1]?mm:"0" + mm[0]) + ":" + (ss[1]?ss:"0" + ss[0]);
}

export function MIODateFromString(string)
{
    var lexer:MIOCoreLexer = new MIOCoreLexer(string);
    
    // Values    
    lexer.addTokenType(0, /^[0-9]{4}-/i); // Year
    lexer.addTokenType(1, /^[0-9]{2}-/i); // Month
    lexer.addTokenType(2, /^[0-9]{2} /i); // day

    lexer.addTokenType(3, /^[0-9]{2}:/i); // hh // mm
    lexer.addTokenType(4, /^[0-9]{2}/i); // ss

    lexer.tokenize();

    var y = -1;
    var m = -1;
    var d = -1;
    var h = -1;
    var mm = -1;
    var s = -1;

    var token = lexer.nextToken();
    while(token != null){

        switch (token.type) {

            case 0:
                y = parseInt(token.value.substring(0, 4));
                break;

            case 1:
                if (y == -1) return null;
                m = parseInt(token.value.substring(0, 2)) - 1;
                break;

            case 2:
                if (m == -1) return null;
                d = parseInt(token.value.substring(0, 2));
                break;

            case 3:
                if (d == -1) return null;
                if (h == -1) h = parseInt(token.value.substring(0, 2));
                else if (mm == -1) mm = parseInt(token.value.substring(0, 2));
                else return null;
                break;

            case 4:
                if (mm == -1) {
                    //return null;
                    d = parseInt(token.value.substring(0, 2));
                }
                else s = parseInt(token.value);
                break;

            default:
                return null;
        }

        token = lexer.nextToken();
    }

    if (h == -1) h = 0;
    if (mm == -1) mm = 0;
    if (s == -1) s = 0;

    var date = new Date(y,m,d,h,mm,s);
    return date;
}

export function MIODateToUTC(date)
{
    var dif = date.getTimezoneOffset();
    let d = new Date();
    d.setTime(date.getTime() + (dif * 60 * 1000));

    return d;
}

export function MIODateAddDaysToDateString(dateString, days)
{
    var d = MIODateFromString(dateString);
    d.setDate(d.getDate() + parseInt(days));
    var ds = MIODateGetDateString(d);

    return ds;
}

export function MIODateRemoveDaysToDateString(dateString, days)
{
    var d = MIODateFromString(dateString);
    d.setDate(d.getDate() - parseInt(days));
    var ds = MIODateGetDateString(d);

    return ds;
}


export function MIODateFromMiliseconds(miliseconds){
  var mEpoch = parseInt(miliseconds); 
  if(mEpoch<10000000000) mEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
  var ds = new Date();
  ds.setTime(mEpoch)
  return ds;
}

export function isDate (x) 
{ 
  return (null != x) && !isNaN(x) && ("undefined" !== typeof x.getDate); 
}

export function MIODateToday(){
    var d = new Date();
    d.setHours(0,0,0);
    return d;
}
export function MIODateNow(){
    return new Date();
}
export function MIODateTodayString(){
    let d = MIODateToday();
    return MIODateGetString(d);
}

export function MIODateYesterday(){
    let d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0,0,0);
    return d;
}

export function MIODateTomorrow(){
    let d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0,0,0);
    return d;
}

export function MIODateGetFirstDayOfTheWeek(date:Date){

    let dayString = MIODateGetDateString(date);
    // TODO: Check sunday start or monday start
    let firstDayString = MIODateRemoveDaysToDateString(dayString, date.getDay() - 1);
    let first = MIODateFromString(firstDayString);

    return first;
}

export function MIODateGetLastDayOfTheWeek(date:Date){

    let dayString = MIODateGetDateString(date);
    // TODO: Check sunday start or monday start
    let lastDayString = MIODateAddDaysToDateString(dayString, (7 - date.getDay()));
    let last = MIODateFromString(lastDayString);

    return last;
}

export function MIODateCopy(date:Date):Date{    
    return new Date(date.getTime());
}