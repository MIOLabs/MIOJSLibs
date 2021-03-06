import { MIOObject } from "./MIOObject";
import { MIOLocale } from "./MIOLocale"

export enum NSCalendarUnit
{
    Era,
    Year,
    YearForWeekOfYear,
    Quarter,
    Month,

    WeekOfYear,
    WeekOfMonth,
    Weekday,
    WeekdayOrdinal,
    Day,

    Hour,
    Minute,
    Second,
    Nanosecond,

    Calendar,
    TimeZone

}

export class NSCalendar extends MIOObject
{
    firstWeekday():number {

        let day = 0;

        switch (this.locale.countryCode){
            case "US":
            case "UK":
            case "AR":
                day = 0;
                break;

            default:
                day = 1;
                break;
        }

        return day;
    }

    private _locale:MIOLocale = null;
    getLocale():MIOLocale {
        if (this._locale == null) return MIOLocale.currentLocale();

        return this._locale;
    }

    setLocale(locale:MIOLocale){
        this._locale = locale;
    }

    get locale():MIOLocale {return this.getLocale();}
    set locale(locale:MIOLocale) {this.setLocale(locale);}

    componentFromDate(component:NSCalendarUnit, date:Date):number {
        
        if (component == NSCalendarUnit.Weekday) {
            let day = date.getDay();    // O means Sunday
            day -= this.firstWeekday(); // We decrement the first the of the week depends on the calendar
            if (day < 0) {
                day = 7 + day;
            }
            return day;
        }

        return 0;
    }

}