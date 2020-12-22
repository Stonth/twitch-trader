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

    const palette = [
        '#0bd3d3', // blue
        '#f890e7', // pink
        '#ffffff', // white
        '#d0d0d0', // gray
        '#000000' // black
    ];

    const stream = new Stream(streamSettings);
    stream.addChannel(ChannelBackground, [0, 0, palette[3]]);
    const chatChannel = stream.addChannel(ChannelChat, [16, 16, 400, streamSettings.height - 32, palette[4], palette[0], palette[0], '20px sans-serif', 30, 60, [8, 8, 8, 8]]);
    const chat = new Chat(config.username, config.oauth);
    chat.addMessageListener((channel, tags, message) => {
        chatChannel.addMessage(tags.username, message);
    });
    stream.startStream();
});