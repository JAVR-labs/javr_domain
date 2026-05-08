import {ServerTypes, ServiceTypes, Statuses, StatusIndicators} from "@server-lib/globals.js";
import React, {useContext} from "react";
import {ServicesContext} from '@pages/services.jsx';
import ServiceButton from "@components/ui/ServicesButtons/ServiceButton.jsx";

import styles from "./ServicesLists.module.scss";
import Accordion from "@components/ui/Accordion/Accordion.jsx";
import StripedList from "@components/ui/StripedList/StripedList.jsx";

const tableClasses = `${styles.servicesTable} table table-responsive`;
const tbodyClasses = "align-middle text-center";

function hasPlayerList(serviceData) {
    const isServer = serviceData.type === ServiceTypes.SERVER;
    const hasPlayerList = serviceData.service.maxPlayers !== undefined;
    return isServer && hasPlayerList;
}

function TableElement(serviceData) {
    const service = serviceData.service;
    const serviceType = serviceData.type;

    const displayName = service.displayName ? service.displayName: service.htmlID.replaceAll('_', ' ');

    return (
        <>
            <tr>
                <td>
                    <span className={`${styles.statusIndicator} me-2`}>
                        {StatusIndicators[service.status]}
                    </span>
                    <span className={styles.statusText}>
                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </span>
                </td>
                <td>{displayName}</td>


                <td>
                    {/*Check if service is generic server (since that's the only one rendered without buttons)*/}
                    {serviceType === ServiceTypes.SERVER && service.type === ServerTypes.GENERIC ? (
                        <div>Unavailable</div>
                    ) : (
                        <span>
                        <ServiceButton serviceType={serviceType} serviceID={service.htmlID} purpose="start"/>
                        <ServiceButton serviceType={serviceType} serviceID={service.htmlID} purpose="stop"/>
                    </span>
                    )
                    }
                </td>
            </tr>

            {/* If service is a server with players property and is online, generate player list */}
            {hasPlayerList(serviceData) && service.status === Statuses.ONLINE ?
                (
                    <>
                        <tr>
                            <td colSpan={3} className="p-0 m-0">
                                <Accordion
                                    title={`Current players: ${service.currPlayers.length}/${service.maxPlayers}`}>
                                    {/* Check if anyone is online */}
                                    {service.currPlayers.length > 0 ? (
                                        // If yes generate list of players
                                        <div className="m-3 mt-1 mb-3">
                                            <StripedList>
                                                {service.currPlayers.map((player) => (
                                                    player
                                                ))}
                                            </StripedList>
                                        </div>
                                    ) : (
                                        // If not leave blank
                                        <></>
                                    )}
                                </Accordion>
                            </td>
                        </tr>
                    </>
                ) : (
                    // If not leave empty
                    <></>
                )
            }
        </>
    )
}

function ManagerList() {
    const data = useContext(ServicesContext);
    let managers = [];
    if (data) {
        managers = data.serverManagers || [];
    }
    if (managers.length !== 0) {
        return (
            <table id="manager-list" className={`${tableClasses} mt-5`}>
                <tbody className={tbodyClasses}>
                <tr>
                    <th colSpan={4}>Server Managers</th>
                </tr>
                <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th colSpan={2}>Interact</th>
                </tr>
                {managers.map((manager, index) => (
                    <TableElement key={index} service={manager} type={ServiceTypes.SERVER_MANAGER}/>
                ))}
                </tbody>
            </table>
        );
    }
}

function ServerList() {
    const data = useContext(ServicesContext);
    let servers = [];
    if (data) {
        servers = data.servers || [];
    }
    if (servers.length !== 0) {
        return (
            <>
                <table id="service-list" className={tableClasses}>
                    <tbody className={tbodyClasses}>
                    <tr>
                        <th colSpan={4}>Servers</th>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <th>Name</th>
                        <th colSpan={2}>Interact</th>
                    </tr>
                    {servers.map((server, index) => (
                        <TableElement key={`${index}-server`} service={server} type={ServiceTypes.SERVER}/>
                    ))}
                    </tbody>
                </table>
            </>
        )
    }
}

function DiscordBotList() {
    const data = useContext(ServicesContext);
    let discordBots = [];
    if (data) {
        discordBots = data.discordBots || [];
    }
    if (discordBots.length !== 0) {
        return (
            <>
                <table id="service-list" className={tableClasses}>
                    <tbody className={tbodyClasses}>
                    <tr>
                        <th colSpan={4}>Discord Bots</th>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <th>Name</th>
                        <th colSpan={2}>Interact</th>
                    </tr>
                    {discordBots.map((discordBot, index) => (
                        <TableElement key={`${index}-dbot`} service={discordBot} type={ServiceTypes.DISCORD_BOT}/>
                    ))}
                    </tbody>
                </table>
            </>
        )
    }
}

export {
    ManagerList, ServerList, DiscordBotList
};