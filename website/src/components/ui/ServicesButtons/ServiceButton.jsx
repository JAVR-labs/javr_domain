import { socket } from '@utils/socket-util.js';
import { Events, ServiceTypes } from '@server-lib/globals.js';
import styles from './service-button.module.scss';

function emitFunction(serviceType, serviceID, requestType) {
    requestType = requestType.toLowerCase();

    // Grouping events
    const startEvents = {
        [ServiceTypes.SERVER]: Events.START_SERVER_REQUEST,
        [ServiceTypes.DISCORD_BOT]: Events.START_DBOT_REQUEST,
        [ServiceTypes.SERVER_MANAGER]: Events.START_SERVER_MANAGER_REQUEST,
    };
    const stopEvents = {
        [ServiceTypes.SERVER]: Events.STOP_SERVER_REQUEST,
        [ServiceTypes.DISCORD_BOT]: Events.STOP_DBOT_REQUEST,
        [ServiceTypes.SERVER_MANAGER]: Events.STOP_SERVER_MANAGER_REQUEST,
    };

    // Pick appropriate event based on request type
    const event =
        requestType !== 'stop'
            ? startEvents[serviceType]
            : stopEvents[serviceType];
    // Ensure that event was picked
    if (event) {
        socket.emit(event, serviceID);
    }
}

function ServiceButton(data) {
    // Get data from parent
    const serviceType = data.serviceType;
    const serviceID = data.serviceID;
    const purpose = data.purpose;

    // Define parts of the button
    const buttonColor =
        purpose.toLowerCase() === 'stop' ? 'btn-danger' : 'btn-success';
    const buttonClass = `button btn btn-sm me-2 ms-2 ${styles.servicesButton} ${buttonColor}`;
    const buttonID = `${serviceID}-button-${purpose.toLowerCase()}`;
    const buttonOnClick = () => emitFunction(serviceType, serviceID, purpose);

    return (
        <>
            <button
                type="button"
                className={buttonClass}
                id={buttonID}
                onClick={buttonOnClick}
            >
                {purpose.toUpperCase()}
            </button>
        </>
    );
}

export default ServiceButton;
