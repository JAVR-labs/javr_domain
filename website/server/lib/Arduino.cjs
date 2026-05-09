const {SerialPort, ReadlineParser} = require("serialport");
const {customLog} = require("@javr-domain/shared/Logger.js");
const SocketEvents = require("@server-lib/SocketEvents.cjs");
const {ArduinoEvents, websiteIO} = require('@server-lib/globals.js');

class ArduinoBoard {
    sensors = {};

    constructor({
                    name,
                    serialPort,
                    baudRate,
                    productId
                }) {
        this.name = name;
        this.id = productId;
        this.serialPort = new SerialPort({
            path: serialPort.path,
            baudRate: baudRate
        });
    }

    sendTimeResponse() {
        const date = new Date();
        const time = date.getTime() - (date.getTimezoneOffset() * 60000);
        const message = ArduinoEvents.TIME_UPDATE_RESPONSE + time + ArduinoEvents.MESSAGE_END;
        this.serialPort.write(message, (err) => {
            if (err) {
                customLog(this.name, `Error sending data: ${err}`)
            }
        });
    }

    startListening() {
        // Create pipe for input from arduino
        const parser = this.serialPort.pipe(new ReadlineParser({delimiter: '\n'}));

        this.serialPort.on("error", (err) => {
            customLog(this.name, err)
        });

        parser.on('data', (data) => {

            // Debug stuff

            // console.log(`ARDUINO BOARD ${this.name} SAYS: ${data}`);

            // Get rid of unwanted chars
            data = data.trim();
            // Check if message was sent correctly
            if (!data.endsWith(ArduinoEvents.MESSAGE_END)) {
                customLog(this.name, "Error reading message");
            }
            else {
                // Remove message end
                data = data.replace(ArduinoEvents.MESSAGE_END, "")
            }

            // If message is status update
            if (data.startsWith(ArduinoEvents.STATUS_UPDATE)) {
                // Remove header
                data = data.replace(ArduinoEvents.STATUS_UPDATE, "");

                // Update data and send update
                try {
                    // Parse data
                    this.sensors = JSON.parse(data);

                    // Send update
                    SocketEvents.statusResponse(websiteIO);
                }
                catch (err) {
                    customLog(this.name, `Error parsing data: ${err}`)
                }
            }

            else if (data.startsWith(ArduinoEvents.TIME_UPDATE_REQUEST)) {
                this.sendTimeResponse();
            }
        })
    }

    setLight({override, brightness, temp}) {
        const message = ArduinoEvents.MODIFY_LIGHT + JSON.stringify({override: override, brightness: brightness, temp: temp}) + ArduinoEvents.MESSAGE_END;
        this.serialPort.write(message);
    }
}

module.exports = ArduinoBoard;