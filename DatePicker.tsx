import * as moment from "moment";
import * as React from "react";
import DayPicker from "react-day-picker";
import MaskedInput from "react-text-mask";
import { IDisabledProp } from "../../_Common";

export interface DatePickerProps extends IDisabledProp {
    onDateChange?: (day: string) => void;
    date?: Date;
    label?: string;
    isValid?: boolean;
    displayLabel?: boolean;
}

export interface DatePickerState {
    selectedDay: string;
    primaryDay: string;
    displayPicker: boolean;
}

export class DatePicker extends React.Component<DatePickerProps, DatePickerState> {

    constructor(props) {
        super(props);
        if (props.isValid === undefined) {
            this.props = {
                ...props,
                isValid: true
            };
        }
        this.state = {
            selectedDay: this.formatDay(props.date),
            primaryDay: this.formatDay(props.date),
            displayPicker: false
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            selectedDay: this.formatDay(nextProps.date),
            primaryDay: this.formatDay(nextProps.date),
            displayPicker: false
        });
    }

    togglePicker = (curr) => {
        this.setState({
            displayPicker: !curr
        });
    }

    closePicker = () => {
        this.setState({
            displayPicker: false
        });
    }

    formatDay = (day: Date) => {
        let formattedData = "";
        if (day) {
            formattedData = moment.utc(day).format("DD/MM/YYYY");
        }
        return formattedData;
    }

    validateDay = (date: string) => {
        const dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        if (date.length === 10 && date.match(dateformat)) {
            this.handleModelSave(date);
            return true;
        } else {
            this.setState({
                selectedDay: this.formatDay(this.props.date)
            });
            return false;
        }
    }

    handleInputChange = (target) => {
        let date = target.value;
        this.setState({
            selectedDay: date,
        });
    }

    handleDayClick = (day: Date) => {
        this.setState({
            selectedDay: this.formatDay(day),
            displayPicker: false
        });
        this.handleModelSave(this.formatDay(day));
    }

    handleModelSave = (day: string) => {
        let conv = day.split("/").reverse().join("-").concat("T00:00:00+00:00");
        if (this.props.onDateChange) {
            this.props.onDateChange(conv);
        }
        this.setState({
            selectedDay: this.formatDay(conv ? new Date(conv) : new Date())
        });
    }
    render() {
        const { selectedDay } = this.state;
        const { isValid, disabled } = this.props;
        let classNames: string[] = ["st-field-wrapper"];
        !isValid && classNames.push("st-field-invalid");
        return (
            <div className={classNames.join(" ")}>
                <div className="form-group">
                    <label style={{ display: this.props.displayLabel === false ? "none" : "block" }}>{this.props.label}</label>
                    <div className="mp-daypicker">
                        <div className="mp-daypicker__input">
                            <MaskedInput
                                mask={[/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/]}
                                placeholder={`${moment().format("DD/MM/YYYY")}`}
                                className="form-control"
                                value={selectedDay ? this.state.selectedDay : undefined}
                                onBlur={(e) => this.validateDay((e.target as any).value)}
                                onChange={(e) => this.handleInputChange(e.target)}
                                disabled={disabled} />
                            {!disabled && <i className="icon-calendar-2" onClick={() => this.togglePicker(this.state.displayPicker)}></i>}
                        </div>
                        <div className="mp-daypicker-handler"
                            onMouseLeave={() => this.closePicker()}>
                            <DayPicker
                                className={(this.state.displayPicker ? "daypicker-toggled" : "daypicker-collapsed")}
                                locale="en"
                                onDayClick={this.handleDayClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
