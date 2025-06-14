import UniversalHead from "@components/misc/UniversalHead.jsx";

import styles from "@styles/terra-metrics.module.scss";
import {mainDivClass} from "@styles/global.bootstrap.js";
import NavBar from "@components/layout/Navbar/NavBar.jsx";
import Footer from "@components/layout/Footer/Footer.jsx";
import DataTable from "@components/layout/DataTable/DataTable.jsx";
import {useEffect, useState} from "react";
import {initServicesSocket, requestSerivcesData} from "@utils/socket-util.js";
import {arduinoBoards} from "@server-lib/globals.js";
import LightControls from "@components/misc/LightControls/LightControls.jsx";


function MainContent() {
    const [data, setData] = useState({
        arduinoBoards: [
            {
                id: -1,
                sensors: {
                    DHT11_0: {
                        temp: 0,
                        humidity: 0,
                    },
                    DHT11_1: {
                        temp: 0,
                        humidity: 0,
                    },
                }
            },
        ]
    });

    useEffect(() => {
        const cleanup = initServicesSocket(setData);
        requestSerivcesData();
        return cleanup;
    }, []);

    // Define sensor readings
    let hotSensor, coldSensor;
    // Get arduino
    const board = data.arduinoBoards[0];
    // Try to get sensors
    let sensors;
    if (board) sensors = board.sensors;

    // Try to get product id
    let productId;
    if (board) productId = board.id;

    if (board && sensors && sensors.DHT11_0 && sensors.DHT11_1) {
        const sensors = data.arduinoBoards[0].sensors;


        if (sensors.DHT11_0.temp > sensors.DHT11_1.temp) {
            hotSensor = sensors.DHT11_0;
            coldSensor = sensors.DHT11_1;
        }
        else {
            hotSensor = sensors.DHT11_1;
            coldSensor = sensors.DHT11_0;

        }
    }
    else {
        hotSensor = {temp: "n/a", humidity: "n/a"};
        coldSensor = {temp: "n/a", humidity: "n/a"};
    }

    return (
        <div className={`${styles.bgImgTerra}`}>
            <div className={styles.fgImgTerra}/>
            <div className={`${styles.dataTableContainer} ${styles.fontStyle}`}>
                <div className={styles.innerBorder}>
                    <DataTable
                        columns={["Temperatura:", "Wilgotność:"]}
                        items={[
                            [
                                ["Najcieplejszy punkt", `${hotSensor.temp}°C`, "#eca054"],
                                ["Najzimniejszy punkt", `${coldSensor.temp}°C`, "#73ffff"],
                            ],
                            [
                                ["Najcieplejszy punkt", `${hotSensor.humidity}%`, "#eca054"],
                                ["Najzimniejszy punkt", `${coldSensor.humidity}%`, "#73ffff"]
                            ]
                        ]}
                    />
                </div>
            </div>
            <div className={styles.cameraContainer}>
                <LightControls productId = {productId}/>
            </div>
        </div>
    )
}


function TerraMetrics() {

    return (
        <>
            {/* Head */}
            <UniversalHead/>

            {/* Body */}
            <div className={`${styles.main} ${mainDivClass}`}>
                <NavBar/>
                <MainContent/>
            </div>

            {/* Footer */}
            <Footer/>
        </>
    )
}

export default TerraMetrics;