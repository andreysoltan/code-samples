import { FilterModel, ListModel } from "@**/globster-app";
import { PrimaryButton } from "@**/globster-controls/lib/src/PrimaryButton";
import { entity, filters } from "@**/globster-data";
import { column, fieldColumn, once, Table } from "@**/globster-forms";
import { Model, referenceField, stringField } from "@**/globster-model";
import { autoinject } from "aurelia-dependency-injection";
import { HttpClient } from "aurelia-fetch-client";
import { observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { download, getOrCreateDefaultList, SettingsManager } from "../../../../_Common";
import { dataModel, ISeason } from "../../../../_Common/dataModel";
import { DataSources } from "../../../../_Common/DataSources";
import { StaticData } from "../../../../_Common/staticData";
import { Getter } from "../../../../_Common/Utils";
import { ISUSelect } from "../../../../_Components";
import { ResetListFiltersButton } from "../../../../_Components/ResetListFiltersButton";
import { Tooltip, TooltipPosition } from "../../../../_Components/Tooltip";
import { CalcModal } from "../CalcModal";

const WsModel = dataModel.FsWorldStanding;

@entity(WsModel.$entity)
@autoinject()
export class WsListModel extends Model {

    @observable seasonsList: ISeason[];

    constructor(
        public _settingsManager: SettingsManager,
        public httpClient: HttpClient,
        public dataSources: DataSources
    ) {
        super();
        this.dataSources.fsDisciplines.load()
            .then(i => {
                this.seasonsList = dataSources.seasons.data;
            });
    }

    RankIndex = stringField(this, WsModel.RankIndex);

    Rank = stringField(this, WsModel.Rank, {
        title: "Rank"
    });

    Points = stringField(this, WsModel.Points, {
        title: "Points"
    });

    FirstName = stringField(this, WsModel.$Person.FirstName, {
        title: "FirstName"
    });

    LastName = stringField(this, WsModel.$Person.LastName, {
        title: "LastName"
    });

    Nationality = stringField(this, WsModel.$Person.$Nationality.Code, {
        title: "Nationality"
    });

    TeamName = stringField(this, WsModel.$Team.Name, {
        title: "Team name"
    });

    CountryName = stringField(this, WsModel.$Team.$Nf.$NfForCountry.Code, {
        title: "Country name"
    });

    Level = stringField(this, WsModel.$FsLevel.Name, {
        title: "Level"
    });

    Season = stringField(this, WsModel.$Season.Name, {
        title: "Season"
    });

    Discipline = stringField(this, WsModel.$FsDiscipline.Name, {
        title: "Discipline"
    });

    Date = stringField(this, WsModel.CreateDate, {
        title: "Created Date"
    });
}

@autoinject()
export class WsListFilterModel extends Model implements FilterModel {

    @observable defaultSeason: string;

    constructor(private dataSources: DataSources) {
        super();
        dataSources.seasons.load().then(i => {
            this.defaultSeason = dataSources.seasons.data[0].Id;
            this.SeasonReference.setValue(this.defaultSeason);
        });
        dataSources.fsLevels.load().then(i => {
            this.LevelReference.setValue(StaticData.FsLevels.Seniors);
        });
        dataSources.fsDisciplines.load().then(i => {
            this.DisciplineReference.setValue(StaticData.FsDisciplines.MenId);
        });
    }

    SeasonReference = referenceField(this, WsModel.$Season.Id, this.dataSources.seasons, {
        title: "Season"
    });

    LevelReference = referenceField(this, WsModel.$FsLevel.Id, this.dataSources.fsJSLevels, {
        title: "Level"
    });

    DisciplineReference = referenceField(this, WsModel.$FsDiscipline.Id, this.dataSources.fsDisciplines, {
        title: "Discipline"
    });

    get filter(): filters.FilterQuery {
        let filterQueryItems: any[] = [];

        if (this.SeasonReference.value) {
            filterQueryItems.push(filters.equals(this.SeasonReference));
        }

        if (this.LevelReference.value) {
            filterQueryItems.push(filters.equals(this.LevelReference));
        }

        if (this.DisciplineReference.value) {
            filterQueryItems.push(filters.equals(this.DisciplineReference));
        }
        return filters.and(filterQueryItems);
    }


}
export interface WsListProps {
    list?: ListModel<WsListModel, WsListFilterModel>;
    sportId?: string;
}

@once((props: WsListProps) => {
    const list: ListModel<WsListModel, WsListFilterModel> = getOrCreateDefaultList(`admin-Ws-list-${props.sportId}`, WsListModel, WsListFilterModel);
    list.filter.DisciplineReference.dataSource.load();
    list.filter.LevelReference.dataSource.load();
    list.filter.SeasonReference.dataSource.load();
    return { list };
})
@observer
export class WsTab extends React.Component<WsListProps, { isModalOpened: boolean }> {

    private createHTML = (data, head, title = this.props.list.model._settingsManager.WSReportName) => {
        let doc = document.implementation.createHTMLDocument("Report");
        let Table = doc.createElement("table");
        let rowHead = doc.createElement("tr");
        let tBody = doc.createElement("tbody");
        let sportName = Getter.getRefName(this.props.list.filter.DisciplineReference.value, this.props.list.filter.DisciplineReference.dataSource.data);

        let tHead = doc.createElement("tr");
        tHead.className = "head";
        let tHeadtd = doc.createElement("td");
        tHeadtd.style.padding = "5px";
        let headTxt = doc.createTextNode(title);
        tHeadtd.appendChild(headTxt);
        tHeadtd.colSpan = 4;
        tHeadtd.style.fontSize = "16px";
        tHeadtd.style.fontWeight = "bold";
        tHead.appendChild(tHeadtd);
        tBody.appendChild(tHead);


        let tHeadline = doc.createElement("tr");
        tHeadline.className = "headline";
        let tHeadlinetd = doc.createElement("td");
        let cellText = doc.createTextNode(sportName);
        tHeadlinetd.appendChild(cellText);
        tHeadlinetd.colSpan = 4;
        tHeadlinetd.className = "category";
        tHeadlinetd.style.paddingTop = "10px";
        tHeadlinetd.style.fontWeight = "bold";
        tHeadlinetd.style.fontSize = "14px";
        tHeadlinetd.style.verticalAlign = "top";
        tHeadlinetd.style.height = "50px";
        tHeadlinetd.style.padding = "5px";
        tHeadline.appendChild(tHeadlinetd);
        tBody.appendChild(tHeadline);

        Table.className = "results";
        Table.style.width = "750px";
        Table.style.borderCollapse = "collapse";
        Table.style.fontFamily = "Arial";
        Table.style.color = "black";
        Table.style.fontSize = "8pt";
        Table.cellSpacing = "0";
        Table.border = "0";

        // header fill
        for (let i = 0; i < head.length; i++) {
            let cell = doc.createElement("td");
            cell.style.padding = "5px";
            let cellText = doc.createTextNode(head[i]);

            if (i === 0 || i === 1) {
                cell.align = "right";
                cell.style.width = "50px";
            } else if (i === 2) {
                cell.style.width = "300px";
            } else {
                cell.style.width = "350px";
            }

            cell.appendChild(cellText);
            rowHead.appendChild(cell);
        }
        tBody.appendChild(rowHead);

        for (let r of data) {
            let row = doc.createElement("tr");

            let dataArray = [
                r.Rank,
                r.Points
            ];

            if (!!r.Person) {
                dataArray.push(
                    Getter.getFullName(r.Person),
                    Getter.getNationality(r.Person)
                );
            } else {
                dataArray.push(
                    r.Team.Name,
                    r.Team.Nf.NfForCountry.Code
                );
            }

            for (let c = 0; c < head.length; c++) {
                let cell = doc.createElement("td");
                cell.style.padding = "5px";
                let cellText = doc.createTextNode(!!dataArray[c] || dataArray[c] === 0 ? dataArray[c] : "");

                if (c === 0 || c === 1) {
                    cell.align = "right";
                    cell.style.width = "50px";
                } else if (c === 2) {
                    cell.style.width = "300px";
                } else {
                    cell.style.width = "350px";
                }
                cell.appendChild(cellText);
                row.appendChild(cell);
            }

            tBody.appendChild(row);
            Table.appendChild(tBody);
        }

        doc.body.appendChild(Table);
        return doc;
    }

    private makeDocument = (data) =>{
        const headings = ["Rank", "Points", "Name", "Country"];
        const output = this.createHTML(data, headings);
        const output1 = output.body.innerHTML;
        const blobContent = [output1];
        let doc = new Blob(blobContent, { type: "text/html" });

        let a = document.createElement("a");
        a.href = URL.createObjectURL(doc);
        a.download = "report.html";
        a.hidden = true;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    constructor(props) {
        super(props);
        this.state = {
            isModalOpened: false
        };
    }

    public toggleModal = (curr: boolean): void => {
        this.setState({
            isModalOpened: !curr
        });
    }

    render() {
        const { list } = this.props;
        const disableReportButtons: boolean = !list.data || list.data.length === 0;
        const createdDate = Getter.getDate(list.data, i => i.CreateDate);
        const disableCalculation = !Getter.disableCalc(list.filter.SeasonReference.value, list.filter.SeasonReference.dataSource.data);

        const seasonId = list.filter.SeasonReference.value;
        const levelId = list.filter.LevelReference.value;
        const disciplineId = list.filter.DisciplineReference.value;

        const reportBaseLink = `export/FsWorldStandingRankings?seasonId=${seasonId}&levelId=${levelId}&disciplineId=${disciplineId}`;

        return (
            <div>
                <CalcModal
                    sportName={"fs"}
                    module={"rankings"}
                    requestName={"worldstanding"}
                    SeasonId={list.filter.SeasonReference.value}
                    LevelId={list.filter.LevelReference.value}
                    DisciplineId={list.filter.DisciplineReference.value}
                    opened={this.state.isModalOpened}
                    toggleModal={() => this.toggleModal(this.state.isModalOpened)}
                    loadData={() => list.loadDataForPage()}/>
                <div className="tab-content-item">
                    <div className="toolbar">
                        <div className="st-filter-panel">
                            <div className="st-filter-panel-btns">
                                <ISUSelect setNewValue={id => list.filter.SeasonReference.setValue(id)}
                                    label={list.filter.SeasonReference.title}
                                    value={list.filter.SeasonReference.value}
                                    options={list.filter.SeasonReference.dataSource.data} />
                                <ISUSelect setNewValue={id => list.filter.LevelReference.setValue(id)}
                                    label={list.filter.LevelReference.title}
                                    value={list.filter.LevelReference.value}
                                    options={list.filter.LevelReference.dataSource.data} />
                                <ISUSelect setNewValue={id => list.filter.DisciplineReference.setValue(id)}
                                    label={list.filter.DisciplineReference.title}
                                    value={list.filter.DisciplineReference.value}
                                    options={list.filter.DisciplineReference.dataSource.data} />
                                <PrimaryButton onClick={() => {
                                    if (list.filter.SeasonReference.value && list.filter.LevelReference.value && list.filter.DisciplineReference.value) {
                                        // to load all data
                                        list.pager.pageSizes = [1000];
                                        list.pager.pageSize = 1000;
                                        list.loadDataForPage();
                                        list.search();
                                    } else {
                                        console.log(list.filter.SeasonReference.value, list.filter.LevelReference.value, list.filter.DisciplineReference.value);
                                        alert("Fill all of the filters");
                                    }
                                }}>Show</PrimaryButton>
                                <ResetListFiltersButton class={"btn-action-delete"} onReset={() => {
                                    list.filter.LevelReference.setValue(StaticData.FsLevels.Seniors);
                                    list.filter.DisciplineReference.setValue(StaticData.FsDisciplines.MenId);
                                    list.filter.SeasonReference.setValue(this.props.list.filter.defaultSeason);
                                    list.data = [];
                                }} />
                                {/* <Tooltip active={true} text="This report is generated on client side.">
                                    <a
                                        className={`st-btn btn btn-primary btn-white ${disableReportButtons ? "link-disabled" : ""}`}
                                        onClick={() => !disableReportButtons && this.makeDocument(list.data)}
                                    >HTML 1</a>
                                </Tooltip> */}
                                <Tooltip active={true} text="This report is generated on server side by using FlexCel.">
                                    <a
                                        className={`st-btn btn btn-primary btn-white ${disableReportButtons ? "link-disabled" : ""}`}
                                        onClick={() =>
                                            !disableReportButtons && download(
                                                list.model.httpClient,
                                                `${reportBaseLink}&exportType=${StaticData.ExportType.HTML}`
                                            )}
                                    >HTML</a>
                                </Tooltip>
                                <PrimaryButton
                                    className="btn-white"
                                    onClick={() => {
                                        download(
                                            list.model.httpClient,
                                            `${reportBaseLink}&exportType=${StaticData.ExportType.XLS}`
                                        );
                                    }}
                                    disabled={disableReportButtons}
                                >XLS</PrimaryButton>
                                <PrimaryButton
                                    className="btn-white"
                                    onClick={() => {
                                        download(
                                            list.model.httpClient,
                                            `${reportBaseLink}&exportType=${StaticData.ExportType.PDF}`
                                        );
                                    }}
                                    disabled={disableReportButtons}
                                >PDF</PrimaryButton>

                            </div>
                            <Tooltip text={disableCalculation ? "Ranking can be recalculated only for current season." : "This will calculate new ranking for chosen combination of season, level, and discipline."}
                                active={true}
                                position={TooltipPosition.top}
                                disabled={disableCalculation}>
                                <button
                                    style={{ pointerEvents: disableCalculation ? "none" : "initial" }}
                                    className="st-btn btn btn-primary btn-red-ow"
                                    onClick={() => this.toggleModal(this.state.isModalOpened)}
                                    disabled={disableCalculation}
                                >Calculate</button>
                            </Tooltip>
                        </div>
                        {!disableReportButtons && <p className="rankings-time">{`As of ${createdDate}`}</p>}
                    </div>
                    <div className="st-container">
                        <div className={list.dataLength > 0 ? "table-container" : "table-container empty-container"}>
                            <Table
                                data={list.data}
                                columns={[
                                    column("Rank", item => {
                                        let resp;
                                        if (item.Rank != null) {
                                            resp = item.Rank;
                                        }
                                        return (resp);
                                    }),
                                    fieldColumn(list.model.Points),
                                    column("Name", item => {
                                        let result = "";
                                        if (item.Person != null) {
                                            result += item.Person.FirstName + " " + item.Person.LastName;
                                        } else {
                                            result += item.Team.Name;
                                        }
                                        return (result);
                                    }),
                                    column("Country", item => {
                                        let result = "";
                                        if (item.Person != null) {
                                            result += item.Person.Nationality.Code;
                                        } else {
                                            result += item.Team.Nf.NfForCountry.Code;
                                        }
                                        return (result);
                                    })
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
