const request = require("request-promise-native")

function PhotoFrameModule(log, config, {Service, Characteristic, photoFrameApi, setTimeout, clearTimeout, Date}) {
    let pollFrequencyMs = (config.pollFrequencySecs || PhotoFrameModule.defaults.pollFrequencySecs) * 1000
    function after(ms, result) {
        return new Promise((success, reject) => {
            setTimeout(() => success(result), ms)
        })
    }
    function syncGetter(fn) {
        return (next) => {
            try {
                next(null, fn())
            }
            catch (error) {
                next(new Error(error))
            }
        }
    }

    class PhotoFrame {
        constructor(name) {
            this.name = name
            this.currentState = {error: "Successful poll not yet completed"}

            this.lastTarget = undefined

            this.switchService = new Service.Switch( this.name )

            this.switchService
                .getCharacteristic( Characteristic.On )
                .on( "get", syncGetter(this.getState.bind( this ) ) )
                .on( "set", this.changeState.bind( this ) )

            this.pollStateRefreshLoop()
        }

        getState() {
            log( "Getting current state asynchronously..." )
            this.triggerStateRefresh().then(
                (isOn) => log( "Status photo frame: %s", isOn ? "on" : "off" ),
                (err) => log ( "Error getting state: %s", err)
            )
            return this.currentDoorState()
        }

        isOn() {
            if (this.currentState.success)
                return this.currentState.success.display === 1
            else
                throw new Error("Last poll failed - " + this.currentState.error)
        }

        currentPhotoFrameState() {
            if (this.isOn())
                return true
            else
                return false
        }

        triggerStateRefresh() {
            return photoFrameApi.getState().then(
                (state) => {
                    this.currentState = {success: state}
                    this.notify()
                    log.debug( "Poll status photo frame: %s", this.isOn() ? "on" : "off" )
                    return this.isOn()
                },
                (error) => {
                    this.currentState = {error: error}
                    throw (error)
                }
            )
        }

        pollStateRefreshLoop() {
            // reset poll timer if already set
            if (this.pollTimer) clearTimeout(this.pollTimer)
            this.pollTimer = setTimeout(() => this.pollStateRefreshLoop(), pollFrequencyMs)

            this.triggerStateRefresh().catch((err) => {
                log("Error polling state", err)
            })
        }

        notify() {
            this.switchService.getCharacteristic(Characteristic.On)
                .updateValue(this.currentPhotoFrameState())
        }

        changeState( state, callback ) {
            let targetStateClosed = state === Characteristic.TargetDoorState.CLOSED
            log( "Set state to %s", targetStateClosed ? "closed" : "open" )

            photoFrameApi.setState(targetStateClosed)
                .then(
                    (_) => {
                        log("Target state successfully received.")
                        this.lastTarget = {
                            ts: Date.now(),
                            closed: targetStateClosed
                        }
                        callback(null)
                        return(after(openCloseDurationMs, true))
                    },
                    (err) => {
                        callback(err)
                        throw(err)
                    })
                .then((_) => this.triggerStateRefresh())
                .catch((err) => {
                    log("Error changing state", err)
                })
        }
    }

    return PhotoFrame
}
PhotoFrameModule.defaults = {
    pollFrequencySecs: 60
}
module.exports = PhotoFrameModule
