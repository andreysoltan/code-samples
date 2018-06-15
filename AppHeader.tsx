import * as React from "react";
import { Component } from "react";
import { once } from "@st/globster-forms";
import { AppRouter } from "../../AppRouter";
import { UserBar } from "./UserBar";
import { Breadcrumb } from "@st/globster-router";
import { getAppService } from "@st/globster-app";
import { observer } from "mobx-react";

export interface AppHeaderProps {
    className?: string;
    router?: AppRouter;
    toggleMenu?: (opened: boolean) => void;
    sidebar: boolean;
    user: any;
}

@once(() => {
    return {
        router: getAppService(AppRouter)
    };
})
@observer
export class AppHeader extends Component<AppHeaderProps, { isOpen: boolean }> {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false
        };
    }

    handleBarChange = (opened) => {
        this.props.toggleMenu(opened);
    }

    handleBarOpen = (curr) => {
        this.setState({
            isOpen: !curr
        });
    }

    render() {
        const { sidebar } = this.props;
        return (
            <div>
                <div className="st-app-header">
                    <div className="st-app-header__functional">
                        {
                            sidebar ? null
                                : <span className="icon icon-isu-menu" onClick={() => this.handleBarChange(sidebar)}><span className="path1"></span><span className="path2"></span><span className="path3"></span><span className="path4"></span></span>
                        }
                        <Breadcrumb router={this.props.router} />
                    </div>
                    <UserBar user={this.props.user} router={this.props.router} />
                </div>
            </div>
        );
    }
}
