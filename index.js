const http = require('http');

let Service;
let Characteristic;
module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-laundrify', 'laundrify', LaundrifySensor);
};

// --== MAIN CLASS ==--
class LaundrifySensor {
    constructor(log, config) {
        this.log = log;

        // configuration
        this.name = config['name'];
        this.id = config['id'];
        this.ipAddress = config['ipAddress'];
        this.threshold = parseInt(config['threshold']);
        this.interval = parseInt(config['interval']);
        this.enabledServices = [];
        this.timer = null;

        this.initSensor();
    }


    // --== SETUP SERVICES  ==--
    initSensor() {
        // info service

        this.pollStatus(() => {

            this.informationService = new Service.AccessoryInformation();
            this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'laundrify')
            .setCharacteristic(Characteristic.Model, 'laundrify')
            .setCharacteristic(Characteristic.SerialNumber, this.deviceId)
            .setCharacteristic(Characteristic.FirmwareRevision, this.version);

            this.enabledServices.push(this.informationService);
            //this.log('Got information service');
        // fan service
        this.sensorService = new Service.ContactSensor(this.name);
        this.sensorService
        .getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getSensorState.bind(this));
        this.enabledServices.push(this.sensorService);


    }, this);
        var that = this;
        this.timer = setInterval(function () {
            that.pollStatus(undefined, that)
        }, this.interval)
    }



    pollStatus(callback, that) {
        console.log('this is', that)
        const status_url = 'http://' + that.ipAddress + '/status';
        console.log('status url:', status_url);
        const req = http.get(status_url, res => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('JSON data is: ', data);
                var statusObject = JSON.parse(data);
                that.deviceId = statusObject.deviceId;
                that.power = statusObject.meters[0].power;
                that.version = statusObject.version;
                if (callback != undefined) {
                    callback();
                }
            });
        }).on("error", (err) => {
            console.log('error on pollStatus', err);
        });
    }





    getSensorState(callback) {
        if (this.power >= this.threshold) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }

    
    getServices() {
        return this.enabledServices;
    }
}