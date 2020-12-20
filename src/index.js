const { spawn } = require('child_process');
const ChannelBackground = require('./channels/background');
const ChannelChat = require('./channels/chat');
const Chat = require('./chat');
const Stream = require('./stream');

const mysql = require('mysql');
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
    }

    const stream = new Stream(streamSettings);
    stream.addChannel(ChannelBackground, [0, 0, '#FFFFFF']);
    const chatChannel = stream.addChannel(ChannelChat, [0, 0, 500, streamSettings.height, '#E0E0E0', '#00BB00', '#00FF00', '20px sans-serif', 30, 60]);
    const chat = new Chat(config.username, config.oauth);
    chat.addMessageListener((channel, tags, message) => {
        chatChannel.addMessage(tags.username, message);
    });
    stream.startStream();
});