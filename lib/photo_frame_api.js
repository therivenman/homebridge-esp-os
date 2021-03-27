const request = require("request-promise-native")

function PhotoFrameApiModule(log) {
    class PhotoFrameApi{
        constructor({ip}) {
            this.baseUrl = "http://" + ip
        }

        urlFor(path, params) {
            let url = this.baseUrl + path
            if (params)
                url = url + params
            return url
        }


        getState() {
            return request.get({ url: this.urlFor("/status") }).then(
                (body) => JSON.parse(body),
                (err) => {
                    log("Error getting state:", err.message)
                    throw err
                })
        }

        _handleResponse(body) {
            let responseCode = JSON.parse(body).result
            switch(responseCode) {
            case 1: return true
            case 2: throw new Error("Not authorized")
            case 3: throw new Error("Mismatch")
            case 16: throw new Error("Data missing")
            case 17: throw new Error("Out of range")
            case 18: throw new Error("Data Format Error")
            case 32: throw new Error("Page Not Found")
            case 48: throw new Error("Not Permitted")
            case 64: throw new Error("Upload Failed")
            default:
                throw new Error("Unrecognized response code: " + responseCode)
            }
        }

        setState(on) {
            let url = this.urlFor(
                "/control/",
                on ? "1" : "0")
            log(url)
            return request.put({url}).then((body) => this._handleResponse(body))
        }
    }

    return PhotoFrameApi
}
module.exports = PhotoFrameApiModule
