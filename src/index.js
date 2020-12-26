const ChannelBackground = require('./channels/background');
const ChannelChat = require('./channels/chat');
const ChannelHeader = require('./channels/header');
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

    let user1;
    let user2;
    Phase.next().then(() => {
        return User.putGetUser('stonth1');
    }).then((u) => {
        user1 = u;
        return User.putGetUser('stonth2');
    }).then((u) => {
        user2 = u;
        return user1.suggest('buy', 'AAPL', 10);
    }).then((suggestion) => {
        user2.vote(0);
    }).catch((err) => console.error(err));

    const stream = new Stream(streamSettings);
    stream.addChannel(ChannelBackground, [0, 0, palette[3]]);
    const chatChannel = stream.addChannel(ChannelChat, [8, 16 + 100 + 8, 400, streamSettings.height - 32 - 8 - 100, palette[4], palette[0], palette[0], palette[2], '20px sans-serif', 30, 60, [8, 8, 8, 8]]);
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
    stream.addChannel(ChannelHeader, [400 + 8 + 8, 16, 1088, 100, palette[4], 'assets/images/header.png']);
    stream.startStream();
});

const isVotePhase = false;
const acceptCommands = false;

function suggestPhase() {
    acceptCommands = false;
    return new Promise((resolve, reject) => {
        const phase = new Phase();
        phase.get().then((results) => {
            const nextPhase = function () {
                Phase.nextPhase().then(() => {
                    // TODO: Refresh the UI.
                    acceptCommands = true;
                    isVotePhase = false;
                    setTimeout(votePhase, 1000 * 60 * 20);
                }).catch();
            };
            if (results.length > 0) {
                // If this isn't the first phase, apply the suggestion.
                Suggestion.mostPopular().then((suggestions) => {
                    Suggestion.apply(suggestions).then(nextPhase).catch((err) => {
                        console.error(err);
                        nextPhase();
                    });
                }).catch((err) => {
                    console.error(err);
                    nextPhase();
                });
            } else {
                nextPhase();
            }
        }).catch(reject);
    });
}

// TODO: Add default suggestions.
function votePhase() {
    acceptCommands = false;
    return new Promise((resolve, reject) => {
        Suggestions.getLatest().then((suggestions) => {
            let suggestionsToAdd = Math.max(3 - suggestions.length, 0);
            const addSuggestions = function () {
                if (suggestionsToAdd <= 0) {
                    // TODO: Refresh the UI.
                    acceptCommands = true;
                    isVotePhase = true;
                    setTimeout(votePhase, 1000 * 60 * 40);
                }
                // TODO: Add suggetions.
            };
            addSuggestions();
        }).catch(reject);
    });
}