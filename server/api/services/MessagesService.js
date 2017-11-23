module.exports = {
    sendMessage: function (event, message, type = "info") {
        let socket = sails.io;

        let msg = {
            date: new Date(),
            msg: message,
            type: type
        };

        socket.emit(event, JSON.stringify(msg));
        
    }
}