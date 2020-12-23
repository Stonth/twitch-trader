const ChannelBackground = require('./channels/background');
const ChannelChat = require('./channels/chat');
const ChannelBottom = require('./channels/bottom');
const Chat = require('./chat');
const Stream = require('./stream');

const Model = require('./model/model');
const Message = require('./model/message');
const User = require('./model/user');
const Suggestion = require('./model/suggestion');
const Vote = require('./model/vote');
const Ticker = require('./model/ticker');
const Phase = require('./model/phase');
const Transaction = require('./model/transaction');
const Position = require('./model/position');

const fs = require('fs');

fs.readFile('config.json', (err, data) => {
    if (err) {
        throw err;
    }
    const config = JSON.parse(data);

    const streamSettings = {
        out: config.out,
        width: 1920,
        height: 1080,
        framerate: 30,
        bitrate: 4000 * 1000
    };

    Model.setConfig(config.database);

    const palette = [
        '#0bd3d3', // blue
        '#f890e7', // pink
        '#ffffff', // white
        '#d0d0d0', // gray
        '#000000' // black
    ];

    User.initialize();
    Ticker.initialize();
    Phase.initialize();
    Suggestion.initialize();
    Vote.initialize();
    Message.initialize();
    Transaction.initialize();
    Position.initialize(config.avKey);

    const stream = new Stream(streamSettings);
    stream.addChannel(ChannelBackground, [0, 0, palette[3]]);
    const chatChannel = stream.addChannel(ChannelChat, [8, 16, 400, streamSettings.height - 32, palette[4], palette[0], palette[0], '20px sans-serif', 30, 60, [8, 8, 8, 8]]);
    const chat = new Chat(config.username, config.oauth);
    chat.addMessageListener((channel, tags, message) => {
        const username = tags.username;

        // Add the message to the chat UI.
        chatChannel.addMessage(username, message);

        // Add to the database.
        User.putGetUser(username).then((user) => {
            const msg = new Message({
                user_id: user.getField('id'),
                message
            });
            msg.save();
        }).catch();
    });
    stream.addChannel(ChannelBottom, [400 + 8 + 8, streamSettings.height - 16 - 294, 1088, 294, palette[4], 'assets/images/bottom.png']);
    // stream.startStream();
});