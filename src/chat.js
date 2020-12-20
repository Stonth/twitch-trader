const tmi = require('tmi.js');

const Chat = function (username, oauth) {
    // Create the Twitch chat client.
    this.client = new tmi.Client({
        options: { debug: true },
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: username,
            password: oauth
        },
        channels: [username]
    });
    this.client.connect();

    this.messageListeners = [];

    this.client.on('message', (channel, tags, message, self) => {
        if (!self) {
            for (listener of this.messageListeners) {
                listener(channel, tags, message);
            }
            this.handleMessage(channel, tags, message);
        }
    });
};

Chat.prototype.addMessageListener = function (listener) {
    this.messageListeners.push(listener);
};

Chat.prototype.handleMessage = function (channel, tags, message) {
    if (message.toLowerCase() === '!hello') {
        // "@alca, heya!"
        client.say(channel, `@${tags.username}, heya!`);
    }
};

module.exports = Chat;