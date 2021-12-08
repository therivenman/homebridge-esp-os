const request = require("request-promise-native")

function EspOsApiModule(log) {
    class EspOsApi{
        constructor({ip, port}) {
            this.baseUrl = "http://" + ip + ":" + port
        }

        urlFor(path, params) {
            let url = this.baseUrl + path
            if (params)
                url = url + params
            return url
        }


        getState() {
            return request.get({ url: this.urlFor("/") }).then(
                (body) => JSON.parse(body),
                (err) => {
                    log("Error getting state:", err.message)
                    throw err
                })
        }

        _handleResponse(body, on) {
            let response = JSON.parse(body).present
            let onText = on ? "1" : "0"
            return response === onText
        }
    }

    return EspOsApi
}
module.exports = EspOsApiModule
