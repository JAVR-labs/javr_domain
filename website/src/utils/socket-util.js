import {io} from "socket.io-client";
import {Events} from "@server-lib/globals.js";

export const socket = io({
    autoConnect: false
});

export function connectSocket() {
    if (!socket.connected) {
        socket.connect();
    }
}

socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
});

export const initServicesSocket = (setData) => {
    connectSocket();

    socket.on(Events.STATUS_RESPONSE, (data) => {
        setData(data);
    });

    socket.on(Events.REQUEST_FAILED, (err) => {
        alert('Error: ' + err);
    });

    socket.on(Events.INFO, (info) => {
        alert(info);
    });

    return () => {
        socket.disconnect();
    };
};


export const innitZTSocket = (setData, setError) => {
    connectSocket();

    socket.on(Events.ZT_RESPONSE, (data)=> {
        setData(data)
    });

    socket.on(Events.ZT_REQUEST_FAILED, (err) => {   
        setError('Error: ' + err);
    });

    return () => {
        socket.disconnect();
    };

};

export const requestSerivcesData = () => {
    socket.emit(Events.STATUS_REQUEST);
};

export const requestZTData = () => {
    socket.emit(Events.ZT_REQUEST);
};

export const ztSendForm = (data, userId) => {
    socket.emit(Events.ZT_SEND_FORM, data, userId);
};

export default socket;