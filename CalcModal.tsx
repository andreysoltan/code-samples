import { getAppService } from "@**/globster-app/lib/src/GetAppService";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@**/globster-controls";
import { once } from "@**/globster-forms/lib/src/Once";
import { ListItem } from "@**/globster-model/lib/src/ListItem";
import { autoinject, Container } from "aurelia-dependency-injection";
import { HttpClient } from "aurelia-fetch-client";
import { observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { DataSources } from "../../../_Common";
import { IFsDiscipline, IFsLevel, ISeason } from "../../../_Common/dataModel";

@autoinject()
class PropsModel {

    @observable public seasons: ISeason[];
    @observable public levels: IFsLevel[];
    @observable public disciplines: IFsDiscipline[];
    @observable public scores: ListItem[];
    @observable public scoresOldDance: ListItem[];


    constructor(public dataSources: DataSources) {
        this.dataSources.fsDisciplines.load()
            .then(i => {
                this.disciplines = dataSources.fsDisciplines.data;
            });
        this.dataSources.seasons.load()
            .then(i => {
                this.seasons = dataSources.seasons.data;
            });
        this.dataSources.fsLevels.load()
            .then(i => {
                this.levels = dataSources.fsLevels.data;
            });
        this.scores = this.dataSources.fsSeasonBestScore();
        this.scoresOldDance = this.dataSources.fsIceDance2011Scores();
    }
}

interface CalcModalProps {
    SeasonId?: any;
    LevelId?: string;
    DisciplineId?: string;
    Score?: string;
    isOld?: boolean;
    opened: boolean;
    requestName: string;
    module: string;
    sportName: string;
    toggleModal: (opened: boolean) => void;
    loadData: () => void;
    model?: PropsModel;
}

@once((props: CalcModalProps) => {
    const model = Container.instance.get(PropsModel);
    model.dataSources.fsLevels.load();
    model.dataSources.fsDisciplines.load();
    model.dataSources.seasons.load();
    return { model };
})
@observer
export class CalcModal extends React.Component<CalcModalProps, {}> {

    _httpClient: HttpClient;

    constructor(props) {
        super(props);
        this._httpClient = getAppService(HttpClient);
    }

    private formRequest = (
        seasonId: string,
        levelId: string,
        disciplineId: string,
        old: boolean = this.props.isOld,
        rank: string = this.props.requestName,
        score: string = this.props.Score,
        module: string = this.props.module,
        sport: string = this.props.sportName): void => {
        const level: string = levelId === "" ? null : levelId;
        let requestString: string = `calculate/${module}/${sport}/${rank}?`;
        if (score === undefined) {
            if (old === undefined) {
                requestString = requestString.concat(`seasonId=${seasonId}&levelId=${level}&disciplineId=${disciplineId}`); // rankings
            } else {
                requestString = requestString.concat(`seasonId=${seasonId}&disciplineId=${disciplineId}&levelId=${level}&iceDanceOlderThen2011=${old}`); // season tech best
            }
        } else if (module === "statistics") {
            seasonId !== undefined
            ? requestString = requestString.concat(`disciplineId=${disciplineId}&score=${score}&seasonId=${seasonId}`) // season best
            : requestString = requestString.concat(`disciplineId=${disciplineId}&score=${score}`); // personal best
        }
        console.log("Request string => ", requestString);

        this._httpClient
            .fetch(`${requestString}`,
                { method: "POST" })
            .then(resp => resp.json() && this.modalSwitcher() && this.fireDataLoad())
            .catch(err => console.log(err) && this.modalSwitcher());
    }

    public modalSwitcher = (): void => {
        this.props.toggleModal(this.props.opened);
    }

    public fireDataLoad = (): void => {
        this.props.loadData();
    }

    get getSeasonName() {
        let name: string = "";
        if (this.props.model && this.props.model.seasons)
            this.props.model.seasons.forEach(el => el.Id === this.props.SeasonId ? name = el.Name : null);
        return name;
    }

    get getLevelName() {
        let name: string = "";
        if (this.props.model && this.props.model.levels)
            this.props.model.levels.forEach(el => el.Id === this.props.LevelId ? name = el.Name : null);
        return name;
    }

    get getDisciplineName() {
        let name: string = "";
        if (this.props.model && this.props.model.disciplines)
            this.props.model.disciplines.forEach(el => el.Id === this.props.DisciplineId ? name = el.Name : null);
        return name;
    }

    render() {
        return (
            <div>
                <Modal onRequestClose={() => this.modalSwitcher()} isOpen={this.props.opened}>
                    <ModalHeader closeButtonAction={() => this.modalSwitcher()}>
                        <h2>Confirmation</h2>
                    </ModalHeader>
                    <ModalBody>
                        <div>
                            {`Current ranking for ${this.getSeasonName} ${this.getLevelName} ${this.getDisciplineName} will be updated based on latest results. This cannot be taken back. Do you want to proceed?`}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={() => this.formRequest(this.props.SeasonId, this.props.LevelId, this.props.DisciplineId)}>Yes</Button>
                        <Button onClick={() => this.modalSwitcher()}>No</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}

