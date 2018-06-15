import { Field } from "@**/globster-model";
import { Container } from "aurelia-dependency-injection";
import { HttpClient } from "aurelia-fetch-client";
import { action, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Component } from "react";
import { IDisabledProp } from "../_Common";
import { Delegate } from "../_Common/Delegate";

const noFoundImgSrc = require("./../_appContent/images/no-found-img.jpg");

export class ImageManager {

    private _httpClient: HttpClient;
    imgRemovalLink: string = "";
    dropZone: any;

    @observable isImageExist: boolean = false;
    @observable imageFile: File;
    @observable hasError: boolean = false;
    @observable imgContent: any;

    constructor() {
        this._httpClient = Container.instance.get(HttpClient);
    }

    @action saveFile = (field): void => {
        if (!this.imageFile) {
            this.hasError = true;
            return;
        }

        // TODO: remove unnesessary img if a user uploads several of them for one entity.
        // Or just upload img to server only when the user clicks save btn.
        // remove old image from DB if exist
        // if (field.value) {
        //     this.imgRemovalLink = this.removalLink(field);
        //     this.removeImgFromServerSide(field);
        // }

        let formData = new FormData();
        formData.append("image", this.imageFile);

        this._httpClient.fetch("document/upload", {
            method: "post",
            body: formData
        })
            .then((response) => {
                if (response.ok) {
                    this.hasError = false;
                    response.json()
                        .then(src => {
                            const imgSrc = "document/download/" + src;
                            if (field) {
                                field.setValue(imgSrc);
                            }
                            this.checkImageExisists(imgSrc);
                        });
                } else {
                    this.hasError = true;
                }
            })
            .catch(reason => {
                console.log(reason);
                this.hasError = true;
            });
    }

    handleFilesDragOver = (e): void => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    }

    @action handleFilesDrop = (e): void => {
        e.stopPropagation();
        e.preventDefault();

        const files = e.dataTransfer.files;
        this.imageFile = files[0];
    }

    bindDragAndDropZonesToEvents = (): void => {
        this.dropZone.addEventListener("dragover", this.handleFilesDragOver.bind(this), false);
        this.dropZone.addEventListener("drop", this.handleFilesDrop.bind(this), false);
    }

    unbindDragAndDropZoneEvents = (): void => {
        this.dropZone.removeEventListener("dragover", this.handleFilesDragOver.bind(this), false);
        this.dropZone.removeEventListener("drop", this.handleFilesDrop.bind(this), false);
    }

    @action handleDragAndDropClick = (e, field): void => {
        const file = e.target.files[0];
        this.imageFile = file;
        if (file != null) {
            this.saveFile(field);
        }
    }

    @action removeImg = (field: Field<string>): void => {
        this.imageFile = null;
        this.imgRemovalLink = this.removalLink(field);
        this.isImageExist = false;
        this.imgContent = null;
        field.setValue(null);
    }

    removeImgFromServerSide = (field: Field<string>) => {
        this.imgRemovalLink &&
            this._httpClient.fetch(this.imgRemovalLink, {
                method: "delete"
            })
                .then((response) => {
                    if (response.ok) {
                        this.hasError = false;
                        if (field) {
                            field.setValue(null);
                        }
                        this.isImageExist = false;
                        this.imgRemovalLink = "";
                    } else {
                        this.hasError = true;
                    }
                })
                .catch(reason => {
                    console.log(reason);
                    this.hasError = true;
                });
    }

    @action async checkImageExisists(imgSrc: string) {
        if (!imgSrc) {
            this.isImageExist = false;
            return;
        }

        let response = await this._httpClient.fetch(imgSrc);

        this.isImageExist = response.ok;

        this.isImageExist &&
            response.blob().then(val => {
                const url = URL.createObjectURL(val);
                this.imgContent = url;
            });
    }

    private getDoucumentId = (field: Field<string>): string => {
        const documentLinkId = field.value.split("/").slice(-1);
        return documentLinkId[0] || "";
    }

    private removalLink = (field: Field<string>): string => {
        const documentLinkId = this.getDoucumentId(field);
        return "document/remove/" + documentLinkId;
    }
}

export interface ImageFieldProps extends IDisabledProp {
    field?: Field<string>;
    removeFromServerSubmit: Delegate;
}

export interface ImageFieldState extends ImageFieldProps {
    imgManager: ImageManager;
}

@observer
export class ImageSelector extends Component<ImageFieldProps, ImageFieldState> {
    constructor(props: ImageFieldProps) {
        super(props);
        this.state = {
            ...props,
            imgManager: new ImageManager()
        };
        this.state.imgManager.checkImageExisists(props.field.value);
        if (props.removeFromServerSubmit) {
            props.removeFromServerSubmit
                .push(() => this.state.imgManager.removeImgFromServerSide(props.field));
        }
    }

    static getDerivedStateFromProps(props: ImageFieldProps, state: ImageFieldState) {
        if (props.field
            && state.field
            && props.field.value === state.field.value
            && state.imgManager.isImageExist
        ) {
            return null;
        } else {
            state.imgManager.isImageExist = false;
            return {
                ...state
            };
        }
    }

    componentDidUpdate(prevProps: ImageFieldProps, prevState: ImageFieldState) {
        if (!prevState.imgManager.isImageExist) {
            prevState.imgManager.checkImageExisists(prevProps.field.value);
        }
    }

    render() {
        const { field, disabled } = this.props;
        const { imgManager } = this.state;

        return (
            <div className="upload-image-component">
                <div className="image-content">
                    <div ref={imgManager.dropZone} className="image-drag-drop-zone" >
                        {
                            !disabled &&
                            <input
                                onChange={(e) => imgManager.handleDragAndDropClick(e, field)}
                                type="file"
                                name="ImageFileUpload"
                                className="file-input"
                                accept="image/*" />
                        }
                        <div id="image-drag-drop-zone" className="zone-description">
                            {
                                imgManager.isImageExist
                                    ? <img src={imgManager.imgContent} className="img-thumbnail" />
                                    : <img src={noFoundImgSrc} className="img-thumbnail" />

                            }
                        </div>
                    </div>
                    {
                        !disabled &&
                        <div className="image-tooltip">
                            <i className="icon-edit"></i>
                            <div className="image-tooltip__text"> Click to change image</div>
                        </div>
                    }
                </div>
                {!disabled && imgManager.isImageExist && <button className="btn-action-delete" onClick={() => imgManager.removeImg(field)}>Delete image</button>}
            </div>
        );
    }
}
