const PhotoFrameModule = require("./lib/photo_frame.js")
const PhotoFrameApiModule = require("./lib/photo_frame_api.js")

module.exports = function( homebridge ) {
    let Service = homebridge.hap.Service
    let Characteristic = homebridge.hap.Characteristic

    class PhotoFrameConnect {
        constructor(log, config) {
            let PhotoFrameApi = PhotoFrameApiModule(log)
            let photoFrameApi = new PhotoFrameApi({
                ip: config.ip,
                key: config.key
            })
            let PhotoFrame = PhotoFrameModule(log, config, {Service, Characteristic, photoFrameApi, setTimeout, clearTimeout, Date})
            this.photoFrame = new PhotoFrame(config.name, true)
        }
        getServices() {
            return([
		   this.photoFrame.switchService,
	           ])
        }
    }
    homebridge.registerAccessory( "homebridge-frame", "Photo Frame", PhotoFrameConnect );
};
