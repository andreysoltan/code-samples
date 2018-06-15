import { getAppService } from "@**/globster-app";
import { PrimaryButton } from "@**/globster-controls/lib/src/PrimaryButton";
import { Table, column, once } from "@**/globster-forms";
import { autoinject } from "aurelia-dependency-injection";
import { HttpClient } from "aurelia-fetch-client";
import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as moment from "moment";
import * as React from "react";
import { download } from "../../../../_Common";
import { DataSources } from "../../../../_Common/DataSources";
import { IFsDiscipline } from "../../../../_Common/dataModel";
import { StaticData } from "../../../../_Common/staticData";
import { ResetListFiltersButton } from "../../../../_Components/ResetListFiltersButton";

@autoinject()
class HtcModel {

    @observable public disciplines: IFsDiscipline[] = [];
    @observable public discipline: IFsDiscipline;

    constructor(public dataSources: DataSources, public httpClient: HttpClient) {
        this.dataSources.fsDisciplines.load()
            .then(i => {
                this.disciplines = dataSources.fsDisciplines.data;
            });
    }
}

interface IHtc {
    CountryCode: string;
    CountryId: string;
    Date: any;
    EventId: string;
    EventName: string;
    FsLevelId: string;
    FsPoints: number;
    LevelCode: string;
    OdPoints: number;
    PdPoints: number;
    PersonId: string;
    PersonOrTeamName: string;
    Rank: number;
    RankIndex: number;
    SpPoints: number;
    TeamId: string;
    TotalPoints: number;
}

interface HtcListProps {
    model?: HtcModel;
    sportId?: string;
}

interface HtcState {
    currDiscipline: string;
    isOld: boolean;
}

@once((props: HtcListProps) => {
    const model = getAppService(HtcModel);
    model.dataSources.fsDisciplines.load();
    return { model };
})
@observer
export class HtcTab extends React.Component<HtcListProps, HtcState> {

    _httpClient: HttpClient;
    @observable darray: IHtc[] = [];
    @observable displayedData: IHtc[] = [];
    @observable arrayOfData: IHtc[][] = [];
    @observable defaultDiscipline: string;
    @observable displayedIndex: number = 0;

    constructor(props) {
        super(props);
        this._httpClient = getAppService(HttpClient);
        const dataSources = getAppService(DataSources);

        this.state = {
            currDiscipline: "",
            isOld: false
        };

        Promise.all([
            dataSources.fsDisciplines.load()
        ]).then(() => {
            this.defaultDiscipline = dataSources.fsDisciplines.data[0].Id;
            this.setState({
                currDiscipline: this.defaultDiscipline,
            });
        });

        window.addEventListener("scroll", this.onWindowScroll);
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.onWindowScroll);
    }

    @computed get disciplinelList() {
        let modifiedList =
            this.props.model.disciplines
                .map(el => {
                    return {
                        value: el,
                        label: el.Name
                    };
                });
        modifiedList.push(StaticData.FsDisciplines.oldSkate);
        return modifiedList;
    }

    @action updateDisplayedArray = () => {
        this.displayedData.push(...this.arrayOfData[this.displayedIndex]);
        this.displayedIndex++;
    }

    @action getHightestScore = (disciplineId: string): void => {
        const IS2011 = disciplineId.includes("is2011");
        if (IS2011) {
            disciplineId = disciplineId.slice(0, disciplineId.length - 6);
        }
        this._httpClient
            .fetch(`statistic/fshighesttotalscore?disciplineId=${disciplineId}&iceDanceOlderThen2011=${IS2011}`)
            .then(r => r.json())
            .then(data => {
                this.darray = data;
                this.darray.sort((a, b) => {
                    const diff = a.RankIndex - b.RankIndex;
                    if (diff === 0) {
                        return a.RankIndex - b.RankIndex || 0;
                    }
                    return diff;
                });

                const itemsCount = this.darray.length;
                const step = 100;

                for (let startIndex = 0; startIndex < itemsCount; startIndex += step) {
                    const copyOfArray = this.darray.slice(startIndex, startIndex + step);
                    this.arrayOfData.push(copyOfArray);
                }

                this.updateDisplayedArray(); // trigger display of data
                console.log("Data from request -> ", this.darray);
                return this.darray;
            })
            .catch(reason => console.log(reason));
    }

    getDocHeight = () => {
        const D = document;
        return Math.max(
            D.body.scrollHeight, D.documentElement.scrollHeight,
            D.body.offsetHeight, D.documentElement.offsetHeight,
            D.body.clientHeight, D.documentElement.clientHeight
        );
    }

    @action onWindowScroll = () => {
        let winheight = window.innerHeight || (document.documentElement || document.body).clientHeight;
        let docheight = this.getDocHeight();
        let scrollTop = window.pageYOffset ;
        let trackLength = docheight - winheight;
        let pctScrolled = Math.floor(scrollTop / trackLength * 100);

        if (pctScrolled >= 95)
            this.updateDisplayedArray();

    }

    render() {
        const allowReportButtons: boolean = this.darray.length > 0;
        const createdDate = moment().format("DD/MM/YYYY, HH:mm");
        const disciplineId = this.state.currDiscipline;
        const isOld = this.state.isOld;
        const reportBaseLink = `export/FsHighestTotalScores?disciplineId=${disciplineId}&iceDanceOlderThen2011=${isOld}`;
        const cols = [
            column("Rank", item => {
                return (item.Rank);
            }),
            column("Name", item => {
                return (item.PersonOrTeamName);
            }),
            column("Country", item => {
                return (item.CountryCode);
            }),
            column("Event", item => {
                return (item.EventName);
            }),
            column("Date", item => {
                return (item.Date ? moment(item.Date).utc().format("DD/MM/YYYY") : ""); // 28.05 - Data is empty everywhere
            }),
            column("Score", item => {
                return (item.TotalPoints);
            }),
            column("Level", item => {
                return (item.LevelCode);
            })
        ];
        const COLS = [
            column(`${this.state.currDiscipline === StaticData.FsDisciplines.IcedanceId ? "SD" : "SP"}`, item => {
                return (item.SpPoints);
            }),
            column(`${this.state.currDiscipline === StaticData.FsDisciplines.IcedanceId ? "FD" : "FS"}`, item => {
                return (item.FsPoints);
            })
        ];
        const OLDCOLS = [
            column("CD", item => {
                return (item.PdPoints);
            }),
            column("OD", item => {
                return (item.OdPoints);
            }),
            column("FD", item => {
                return (item.FdPoints);
            }),
        ];
        this.state.isOld
            ? cols.splice(5, 0, ...OLDCOLS)
            : cols.splice(5, 0, ...COLS);
        return (
            <div>
                <div className="tab-content-item">
                    <div className="toolbar">
                        <div className="st-filter-panel">
                            <div className="st-filter-panel-btns">
                                <div className="st-field-wrapper">
                                    <div className="form-group">
                                        <label>Discipline</label>
                                        <div className="st-field">
                                            <select className="form-control" defaultValue={StaticData.Settings.unselectedString} value={this.state.currDiscipline} onChange={(event) => this.setState({
                                                currDiscipline: event.target.value
                                            })}>
                                                {this.disciplinelList.map((el) => {
                                                    return <option key={el.value.Name} value={el.value.Id}>{el.label}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <PrimaryButton onClick={() => this.state.currDiscipline
                                    ? this.getHightestScore(this.state.currDiscipline)
                                    : alert("fill all the filters")}>Show</PrimaryButton>
                                <ResetListFiltersButton class={"btn-action-delete"} onReset={() => {
                                    this.darray = [];
                                    return this.setState({
                                        currDiscipline: StaticData.FsDisciplines.MenId
                                    });
                                }} />

                                <a className={`st-btn btn btn-primary btn-white ${!allowReportButtons ? "link-disabled" : ""}`}
                                    onClick={() =>
                                        allowReportButtons && download(
                                            this.props.model.httpClient,
                                            `${reportBaseLink}&exportType=${StaticData.ExportType.HTML}`
                                        )}> HTML </a>

                                <PrimaryButton
                                    className="btn-white"
                                    onClick={() =>
                                        download(
                                            this.props.model.httpClient,
                                            `${reportBaseLink}&exportType=${StaticData.ExportType.XLS}`
                                        )}
                                    disabled={!allowReportButtons}
                                >XLS</PrimaryButton>

                                <PrimaryButton
                                    className="btn-white"
                                    onClick={() =>
                                        download(
                                            this.props.model.httpClient,
                                            `${reportBaseLink}&exportType=${StaticData.ExportType.PDF}`
                                        )}
                                    disabled={!allowReportButtons}
                                >PDF</PrimaryButton>
                            </div>
                        </div>
                        {allowReportButtons && <p className="rankings-time">{`As of ${createdDate}`}</p>}
                    </div>
                    <div className="st-container">
                        <div className={"table-container"}>
                            <Table
                                data={this.displayedData}
                                columns={[
                                    ...cols
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
