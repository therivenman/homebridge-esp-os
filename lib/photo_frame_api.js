const request = require("request-promise-native")

function PhotoFrameApiModule(log) {
    class PhotoFrameApi{
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
            return request.get({ url: this.urlFor("/status") }).then(
                (body) => JSON.parse(body),
                (err) => {
                    log("Error getting state:", err.message)
                    throw err
                })
        }

        _handleResponse(body, on) {
            let response = JSON.parse(body).display
            let onText = on ? "1" : "0"
            return response === onText
        }

        setState(on) {
            let url = this.urlFor(
                "/control/",
                on ? "1" : "0")
            log(url)
            return request.put({url}).then((body) => _handleResponse(body, on))
        }
    }

    return PhotoFrameApi
}
module.exports = PhotoFrameApiModule
