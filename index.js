const EspOsModule = require("./lib/esp_os.js")
const EspOsApiModule = require("./lib/esp_os_api.js")

module.exports = function( homebridge ) {
    let Service = homebridge.hap.Service
    let Characteristic = homebridge.hap.Characteristic

    class EspOsConnect {
        constructor(log, config) {
            let EspOsApi = EspOsApiModule(log)
            let espOsApi = new EspOsApi({
                ip: config.ip,
                port: config.port
            })
            let EspOs = EspOsModule(log, config, {Service, Characteristic, espOsApi, setTimeout, clearTimeout, Date})
            this.espOs = new EspOs(config.name, true)
        }
        getServices() {
            return([
		   this.espOs.occupancyService,
	           ])
        }
    }
    homebridge.registerAccessory( "homebridge-esp-os", "ESP Os", EspOsConnect );
};
