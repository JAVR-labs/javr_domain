import { useState } from 'react';
import styles from './LightControls.module.scss';
import socket from '@utils/socket-util.js';
import { Events } from '@server-lib/globals.js';

let updateTimeout = null;
let overrideState = false;

function setOverride(event, setLightParam, productId) {
    overrideState = event.target.checked;
    changeLightParam(event, setLightParam, productId);
}

function changeLightParam(event, setLightParam, productId) {
    const isCheckBox = event.target.type === 'checkbox';
    const param = event.target.id.toLowerCase();
    const value = isCheckBox ? event.target.checked : event.target.value;
    setLightParam((lightParams) => {
        let res;
        if (param in lightParams.temp) {
            res = {
                ...lightParams,
                temp: {
                    ...lightParams.temp,
                    [param]: value,
                },
            };
        } else {
            res = {
                ...lightParams,
                [param]: value,
            };
        }
        res = {
            ...res,
            override: Number(overrideState),
        };
        // If board is defined send updated values to the server
        if (overrideState || (isCheckBox && !updateTimeout && productId)) {
            socket.emit(Events.ARDUINO_MODIFY_LIGHT, productId, res);

            updateTimeout = setTimeout(() => {
                updateTimeout = null;
            }, 500);
        }

        return res;
    });
}

function LightControls(data) {
    const productId = data.productId;
    const [lightParams, setLightParams] = useState({
        override: false,
        brightness: 255,
        temp: {
            red: 255,
            green: 140,
            blue: 50,
        },
    });

    return (
        <div className={`${styles.lightControls}`}>
            <div className="d-flex flex-column">
                <div className="d-flex flex-column mb-3">
                    <label htmlFor="override">Manualna kontrola światła</label>
                    <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        id="override"
                        onChange={(event) =>
                            setOverride(event, setLightParams, productId)
                        }
                    />
                </div>

                <div>
                    <label htmlFor="Brightness" className="form-label">
                        Jasność
                    </label>
                    <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="255"
                        defaultValue="255"
                        id="Brightness"
                        onMouseUp={(event) =>
                            changeLightParam(event, setLightParams, productId)
                        }
                    />
                </div>

                <div>Temperatura:</div>
                <div className={styles.tempParamContainer}>
                    <label htmlFor="Red" className={styles.redLabel}>
                        Red
                    </label>
                    <div className="ms-auto">
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max="255"
                            defaultValue="255"
                            id="Red"
                            onMouseUp={(event) =>
                                changeLightParam(
                                    event,
                                    setLightParams,
                                    productId
                                )
                            }
                        />
                    </div>
                </div>
                <div className={styles.tempParamContainer}>
                    <label htmlFor="Green" className={styles.greenLabel}>
                        Green
                    </label>
                    <div className="ms-auto">
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max="255"
                            defaultValue="140"
                            id="Green"
                            onMouseUp={(event) =>
                                changeLightParam(
                                    event,
                                    setLightParams,
                                    productId
                                )
                            }
                        />
                    </div>
                </div>
                <div className={styles.tempParamContainer}>
                    <label htmlFor="Blue" className={styles.blueLabel}>
                        Blue
                    </label>
                    <div className="ms-auto">
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max="255"
                            defaultValue="50"
                            id="Blue"
                            onMouseUp={(event) =>
                                changeLightParam(
                                    event,
                                    setLightParams,
                                    productId
                                )
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LightControls;
