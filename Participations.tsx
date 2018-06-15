import { getAppService } from "@**/globster-app/lib/src/GetAppService";
import { PrimaryButton } from "@**/globster-controls/lib/src/PrimaryButton";
import { once } from "@**/globster-forms/lib/src/Once";
import { column, Table } from "@**/globster-forms/lib/src/Table";
import { autoinject } from "aurelia-dependency-injection";
import { HttpClient } from "aurelia-fetch-client";
import { computed, observable, action, runInAction } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { AppRouter } from "../../../../AppRouter";
import { ICountry, IParticipationDto, ISeason } from "../../../../_Common/dataModel";
import { DataSources } from "../../../../_Common/DataSources";
import { StaticData } from "../../../../_Common/staticData";
import { IParticipationInfo } from "../PersonDetail";

@autoinject()
class PartModel {

    @observable public seasons: ISeason[] = [];
    @observable public countriesList: ICountry[] = [];

    @observable public season: ISeason;
    @observable public country: ICountry;

    constructor(public dataSources: DataSources) {
        this.dataSources.seasons.load()
            .then(i => {
                this.seasons = dataSources.seasons.data;
            });
        this.dataSources.countriesDisplayCodeAndName.load()
            .then(i => {
                this.countriesList = dataSources.countriesDisplayCodeAndName.data;
            });
    }
}

interface IPartProps {
    model?: PartModel;
    events?: IParticipationDto[];
    router: AppRouter;
    loadInfo: () => Promise<IParticipationInfo>;
}

interface IPartState {
    currSeason: string;
    currCountry: string;
    currSearch: string;
}

@once((props: IPartProps) => {
    const model = getAppService(PartModel);
    model.dataSources.fsLevels.load();
    model.dataSources.fsDisciplines.load();
    return { model };
})
@observer
export class ParticipationsInfo extends React.Component<IPartProps, IPartState> {

    _httpClient: HttpClient;
    darray: IParticipationDto[] = observable([], { // Mobx version 5
        proxy: false
    });
    @observable hasFs: boolean;
    @observable displayedArray: IParticipationDto[] = [];
    @observable defaultSeason: string;

    constructor(props) {
        super(props);
        this._httpClient = getAppService(HttpClient);
        const dataSources = getAppService(DataSources);
        this.state = {
            currSeason: "",
            currCountry: "",
            currSearch: "",
        };

        Promise.all([
            dataSources.seasons.load(),
            dataSources.countriesDisplayCodeAndName.load(),
        ]).then(() => {
            // this.defaultSeason = dataSources.seasons.data[0].Name;
            this.props.loadInfo().then(result => {
                runInAction("participations-callback", () => {
                    result.events = result.events.sort((first, second) => {
                        const firstYear = Number(first.From.slice(6, 10));
                        const secondYear = Number(second.From.slice(6, 10));
                        const diff = firstYear - secondYear;

                        if (diff)
                            return firstYear > secondYear ? -1 : 1;
                        return 0;
                    });
                    this.darray = result.events;
                    this.hasFs = result.isFs;
                    this.displayedArray = this.darray;
                    this.setState({
                        currSeason: this.defaultSeason
                    });
                });
            });
        });
    }

    componentDidMount() {
        this.displayedArray = this.darray;
    }

    @computed get seasonList() {
        return this.props.model.seasons
            .map(el => {
                return {
                    value: el,
                    label: el.Name
                };
            });
    }

    @computed get countryList() {
        return this.props.model.countriesList
            .map(el => {
                return {
                    value: el,
                    label: el.Name
                };
            });
    }

    public handleSeasonChange = (val: string): void => this.setState({ currSeason: val });

    public handleCountryChange = (val: string): void => this.setState({ currCountry: val });

    public handleSearch = (val: string): void => this.setState({ currSearch: val });

    @action public filterList = () => {
        let resultArray: IParticipationDto[] = [];
        if (this.state.currSearch.length > 0) {
            this.darray.map(row => {
                let isMatched: boolean = false;
                Object.entries(row)
                    .filter(element => element[0].includes("Id") ? null : element)
                    .map(column => { // column[0] - Column Name, column [1] - Column value
                        const columnValue = column[1];
                        if (typeof (columnValue) === "string") {
                            if (columnValue && isMatched === false && columnValue.toString().toLowerCase().includes(this.state.currSearch.toLowerCase())) {
                                isMatched = true;
                                resultArray.push(row);
                            }
                        } else {
                            if (!!columnValue)
                                columnValue.map(item => {
                                    let colArrayVal: string;
                                    if (!!item) {
                                        colArrayVal = item.toString().toLowerCase();
                                        colArrayVal.includes(this.state.currSearch.toLowerCase()) && isMatched === false
                                            ? resultArray.push(row)
                                            : null;
                                    }
                                });
                        }
                    });
            });
            this.displayedArray = resultArray;
        } else if (this.state.currSeason !== StaticData.Settings.unselectedString) {
            this.displayedArray = this.darray.filter(el => el.SeasonName === this.state.currSeason);
        } else if (this.state.currCountry) {
            this.displayedArray = this.darray.filter(el => el.Country === this.state.currCountry);
        } else {
            this.displayedArray = this.darray;
        }
    }

    private resetList = () => {
        this.setState({
            currSeason: this.defaultSeason,
            currCountry: "",
            currSearch: ""
        });
        this.displayedArray = this.darray;
    }

    render() {
        const { router } = this.props;
        const EventDetailsRoute = router.Results_Events_Detail_FinalResults;
        let cols = [
            column("Name", (item: IParticipationDto) => {
                return (item.EventName);
            }),
            column("Sport", (item: IParticipationDto) => {
                return (item.SportCode);
            }),
            column("Event Type", (item: IParticipationDto) => {
                return (item.EventTypeName);
            }),
            column("Season", (item: IParticipationDto) => {
                return (item.SeasonName);
            }),
            column("From", (item: IParticipationDto) => {
                return (item.From);
            }),
            column("Location", (item: IParticipationDto) => {
                return (item.Location);
            }),
            column("Country", (item: IParticipationDto) => {
                return (item.Country);
            })
        ];

        if (this.hasFs) {
            cols.push(
                column("Category", (item: IParticipationDto) => {
                    return (item.Category);
                }),
                column("For Country", (item: IParticipationDto) => {
                    return (item.ForCountry);
                }),
                column("Result", (item: IParticipationDto) => {
                    return (item.Result);
                }),
                column("WS Points", (item: IParticipationDto) => {
                    return (item.WcPoints);
                }),
            );
        }

        return (
            <div className="person-info person-info-table">
                <div className="toolbar">
                    <div className="st-field-wrapper">
                        <div className="form-group">
                            <label>Season</label>
                            <div className="st-field">
                                <select className="form-control" defaultValue={StaticData.Settings.unselectedString} value={this.state.currSeason}
                                    onChange={(event) => this.handleSeasonChange(event.target.value)}
                                >
                                    <option value={StaticData.Settings.unselectedString}>{StaticData.Settings.unselectedString}</option>;
                                    {this.seasonList.map((el) => {
                                        return <option key={el.value.Id} value={el.value.Name}>{el.label}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="st-field-wrapper">
                        <div className="form-group">
                            <label>Country</label>
                            <div className="st-field">
                                <select className="form-control" defaultValue={StaticData.Settings.unselectedString} value={this.state.currCountry}
                                    onChange={(event) => this.handleCountryChange(event.target.value)}
                                >
                                    <option value={StaticData.Settings.unselectedString}>{StaticData.Settings.unselectedString}</option>;
                                    {this.countryList.map((el) => {
                                        return <option key={el.value.Id} value={el.value.Code}>{el.label}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="st-field-wrapper">
                        <div className="form-group">
                            <label style={{ visibility: "hidden" }}>Search</label>
                            <div className="st-field">
                                <input type="text" placeholder="Search..." value={this.state.currSearch}
                                    onChange={(e) => this.handleSearch(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <PrimaryButton onClick={() => this.filterList()}>Filter</PrimaryButton>
                    <PrimaryButton onClick={() => this.resetList()}>Reset</PrimaryButton>
                </div>
                <div className="st-container">
                    <div className="table-container">
                        <Table
                            data={this.displayedArray}
                            onRowClick={(item: IParticipationDto) => EventDetailsRoute.navigator({ id: item.EventId, competitionId: item.CompetitionId[0], }).navigate()}
                            columns={[
                                ...cols
                            ]}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
