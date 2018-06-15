import { getAppService } from "@**/globster-app";
import { Link, RouteDestination } from "@**/globster-router";
import { observer } from "mobx-react";
import * as React from "react";
import { AppRouter } from "../AppRouter";

export interface TabModel {
    displayOrder?: number;
    name?: string;
    content?: any;
    getLink: () => RouteDestination<any>;
    allovedDestinations?: string[];
}

export interface IListTabModel {
    tabs: TabModel[];
}

@observer
export class TabComponent extends React.Component<IListTabModel, {}> {

    private _router = getAppService(AppRouter);

    constructor(props: IListTabModel) {
        super(props);
        this.refreshAllovedDestinations();
    }

    componentDidUpdate() {
        this.refreshAllovedDestinations();
    }

    refreshAllovedDestinations = () => {
        for (const tab of this.props.tabs) {
            if (!tab.allovedDestinations) {
                tab.allovedDestinations = [];
            }
            if (tab.allovedDestinations.every(d => tab.getLink().path !== d)) {
                tab.allovedDestinations.push(tab.getLink().path);
            }
        }
    }

    render() {
        const { tabs } = this.props;
        const orderedTabs = tabs.sort((firstTab, secondTab) => firstTab.displayOrder - secondTab.displayOrder);

        const currentPath = this._router.currentRoute
            ? this._router.currentRoute.navigator({ ...this._router.currentRoute.params }).path
            : "";

        return (
            <div className="tab-container">
                <div className="tab-bar">
                    {
                        orderedTabs.map((item: TabModel) => {
                            let classes: string = "st-btn";
                            if (item.allovedDestinations.some(d => d === currentPath)) {
                                classes = classes.concat(" active-tab");
                            }

                            return (
                                <button
                                    className={classes}
                                    key={item.name}>
                                    <Link to={item.getLink()}>{item.name}</Link>
                                </button>
                            );
                        })
                    }
                </div>
                <div className="tab-content">
                    {
                        orderedTabs.map((item: TabModel) => {
                            if (item.allovedDestinations.some(d => d === currentPath)) {
                                return item.content;
                            }
                        })
                    }
                </div>
            </div>
        );
    }
}
