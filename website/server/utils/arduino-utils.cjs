const {SerialPort} = require("serialport");
const {arduinoBoards, ArduinoEvents} = require("@server-lib/globals.js");
const {customLog} = require("@javr-domain/shared/Logger.js");
const {usb} = require("usb");
const ArduinoBoard = require("@server-lib/Arduino.cjs");

const logName = "Arduino_Utils";

function registerBoards(arduinos) {
    // Search for already connected devices
    SerialPort.list().then(ports => {
        for (const port of ports) {
            const arduino = arduinos[String(port.productId)];
            if (arduino) {
                const board = new ArduinoBoard(Object.assign({}, arduino, {
                    serialPort: port,
                    productId: port.productId
                }));
                arduinoBoards.push(board);
                customLog(logName, `Found board ${board.name} on: ${port.path}`);
                board.startListening();
                board.serialPort.write(ArduinoEvents.CONNECT + ArduinoEvents.MESSAGE_END, (err) => {
                    if (err) {
                        customLog(board.name, "Error sending connect event")
                    }
                });
            }
        }
    });
}

function initialiseBoards(arduinos) {
    // Add boards that are already connected
    registerBoards(arduinos);


    // Handle new boards
    usb.on('attach', () => {
        registerBoards(arduinos);
    });
    // Handle disconnects
    usb.on('detach', (device) => {
        const productId = device.deviceDescriptor.idProduct.toString(16);

        for (const arduino of arduinoBoards) {
            if (arduino.id === productId) {
                arduinoBoards.splice(arduinoBoards.indexOf(arduino), 1);
            }
        }

        registerBoards(arduinos);
    })
}

function getBoardByPID(productId) {
    for (const board of arduinoBoards) {
        if (board.id === productId) {
            return board;
        }
    }
}

module.exports = {initialiseBoards, getBoardByPID};