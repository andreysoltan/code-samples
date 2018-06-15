import * as moment from "moment";

export class Getter {

    public static getDate = (data: any[], dateFieldName: (item: any) => string): string => {
        let res = "";

        if (data) {

            for (const i of data) {
                res = dateFieldName(i);
                if (res) {
                    res = moment(res).format("DD/MM/YYYY, HH:mm");
                }
                return res;
            }
        }
    }

    public static getFullName(person): string {
        return !!person ? `${person.FirstName} ${person.LastName}` : "";
    }

    public static getNationality(person): string {
        return !!person ? `${person.Nationality.Code}` : "";
    }

    public static getRefName(id, ds, brackets?): string {
        let sName = "";
        ds.forEach(obj => {
            if (obj.Id === id) {
                sName = obj.Name;
            }
        });

        if (brackets === true && !!sName) {
            sName = "(" + sName + ")";
        }

        return sName;
    }

    public static disableCalc(seasonId: string, seasonsArray: any[]): boolean {
        let title: string;
        let resp: boolean;
        if (new Date().getMonth() >= 6) {
            resp = false;
        } else {
            seasonsArray.forEach(el => el.Id === seasonId
                ? title = el.Name
                : null);
            if (title) {
                const yearFrom = new Date().getFullYear() - 1 ;
                title = title.slice(0, 4);
                resp = title === yearFrom.toString();
            }
        }
        return resp;
    }
}