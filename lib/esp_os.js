const request = require("request-promise-native")

function EspOsModule(log, config, {Service, Characteristic, espOsApi, setTimeout, clearTimeout, Date}) {
    let pollFrequencyMs = (config.pollFrequencySecs || EspOsModule.defaults.pollFrequencySecs) * 1000
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

    class EspOs {
        constructor(name) {
            this.name = name
            this.currentState = {error: "Successful poll not yet completed"}

            this.occupancyService = new Service.OccupancySensor( this.name )

            this.occupancyService.getCharacteristic( Characteristic.OccupancyDetected )
                .on( "get", syncGetter(this.getState.bind( this ) ) )

            this.pollStateRefreshLoop()
        }

        getState() {
            log( "Getting current state asynchronously..." )
            this.triggerStateRefresh().then(
                (isPresent) => log( "Status occupancy sensor: %s", isPresent ? "present" : "not present" ),
                (err) => log ( "Error getting state: %s", err)
            )
            return this.isPresent()
        }

        isPresent() {
            if (this.currentState.success)
                return this.currentState.success.present === 1
            else
                throw new Error("Last poll failed - " + this.currentState.error)
        }

        currentEspOsState() {
            if (this.isPresent())
                return Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
            else
                return Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED
        }

        triggerStateRefresh() {
            return espOsApi.getState().then(
                (state) => {
                    this.currentState = {success: state}
                    this.notify()
                    log.debug( "Poll status occupancy sensor: %s", this.isPresent() ? "present" : "not present" )
                    return this.isPresent()
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
            this.occupancyService.getCharacteristic(Characteristic.OccupancyDetected)
                .updateValue(this.currentEspOsState())
        }
    }

    return EspOs
}
EspOsModule.defaults = {
    pollFrequencySecs: 60
}
module.exports = EspOsModule
