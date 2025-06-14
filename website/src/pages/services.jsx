import UniversalHead from "@components/misc/UniversalHead.jsx";
import NavBar from "@/src/components/layout/Navbar/NavBar.jsx";
import Footer from "@/src/components/layout/Footer/Footer.jsx";
import {
    DiscordBotList,
    ManagerList,
    ServerList,
} from "@/src/components/layout/ServicesLists/ServicesLists.jsx";
import {createContext, useEffect, useState} from "react";
import {initServicesSocket, requestSerivcesData} from "@utils/socket-util.js";
import styles from "@/src/styles/services.module.scss"
import {mainDivClass} from "@styles/global.bootstrap.js";

export const ServicesContext = createContext({servers: [], discordBots: [], serverManagers: []});

function MainContent() {
    const [data, setData] = useState();

    useEffect(() => {
        const cleanup = initServicesSocket(setData);
        requestSerivcesData();
        return cleanup;
    }, []);

    return (
        <>
            <div
                className="container services-container mx-lg-auto mt-5  d-flex flex-column align-items-center max-width-4">
                <h2 className="d-md-block">Aktualny stan serwerów/botów</h2>


                <ServicesContext.Provider value={data}>
                        <ManagerList/>
                        <DiscordBotList/>
                        <ServerList/>
                </ServicesContext.Provider>
            </div>
        </>
    )
}

function Services() {
    return (
        <>
            {/* Head */}
            <UniversalHead/>

            {/* Body */}
            <div className={`${styles.bgImgServices} ${mainDivClass}`}>
                <NavBar/>
                <MainContent/>
            </div>

            {/* Footer */}
            <Footer/>
        </>
    )
}

export default Services;