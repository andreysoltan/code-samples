import * as React from "react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
const loaderSvg = require("../_appContent/images/ISU-Logo-lg.png");

export class ISULoaderModel {

    @observable display: boolean = false;

    @action show = () => {
        this.display = true;
    }

    @action hide = () => {
        this.display = false;
    }
}

export interface ISULoaderProps {
    model?: ISULoaderModel; // TODO: make model required
    display?: boolean;
}

@observer
export class ISULoader extends React.Component<ISULoaderProps, { display?: boolean }> {

    render() {
        const { model } = this.props;
        let displayMode;
        if (model) {
            model.display ? displayMode = "block" : displayMode = "none";
        } else if (!this.props.display) {
            this.props.display ? displayMode = "block" : displayMode = "none";
        }
        return (
            <div style={{ display: displayMode }} className="isu-loader">
                <img src={loaderSvg} />
            </div>
        );
    }
}
