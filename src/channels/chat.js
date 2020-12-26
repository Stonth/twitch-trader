const Channel = require('./channel');
const {createCanvas} = require('canvas');

const ChannelChat = function (streamSettings, x, y, width, height, backgroundColor, userColor, messageColor, actionColor, font, lineHeight, maxMessages, padding) {
    this.width = width;
    this.height = height;
    Channel.call(this, streamSettings, x, y);
    this.backgroundColor = backgroundColor;
    this.messageColor = messageColor;
    this.userColor = userColor;
    this.actionColor = actionColor;
    this.lineHeight = lineHeight;
    this.maxMessages = maxMessages;
    this.padding = padding;

    this.messages = [];
    
    this.context.textBaseline = 'top';
    this.context.font = font;
    this.redraw();

};
ChannelChat.prototype = Object.create(Channel.prototype);

ChannelChat.prototype.addMessage = function (user, message) {
    this.messages.push({ user, message });
    if (this.messages.length > this.maxMessages) {
        this.messages.splice(this.messages.length - 1, 1);
    }

    this.redraw();
};

ChannelChat.prototype.addAction = function (action) {
    this.messages.push({ isAction: true, user, message: action });
    if (this.messages.length > this.maxMessages) {
        this.messages.splice(this.messages.length - 1, 1);
    }

    this.redraw();
};

ChannelChat.prototype.redraw = function () {
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.getWidth(), this.getHeight());

    if (this.messages.length > 0) {
        let y = this.getHeight() - this.getChatHeight() - this.padding[1];
        for (message of this.messages.reverse()) {
            // First, write the username.
            let x = this.padding[0];
            if (!message.isAction) {
                this.context.fillStyle = this.userColor;
                let userStr = '[' + message.user + ']: ';
                this.context.fillText(userStr, x, y);
                x = this.context.measureText(userStr).width;
                this.context.fillStyle = this.messageColor;
            } else {
                this.context.fillStyle = this.actionColor;
            }

            // Write the other messages.
            let wordsOnLine = message.isAction ? 0 : 1;
            const words = message.message.split(' ');
            let line = '';
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const width = this.context.measureText(testLine).width;
                if (x + width > this.getWidth() - this.padding[2] && wordsOnLine > 0) {
                    this.context.fillText(line, x, y);
                    y += this.lineHeight;
                    line = words[i] + ' ';
                    x = this.padding[0];
                    wordsOnLine = 0;
                }
                else {
                    wordsOnLine++;
                    line = testLine;
                }
            }
            this.context.fillText(line, x, y);
            y += this.lineHeight;
        }
    }

    this.dirty = true;
};

ChannelChat.prototype.getChatHeight = function () {
    if (this.messages.length <= 0) {
        return 0;
    }
    let y = 0;
    for (message of this.messages.reverse()) {
        let x = this.padding[0];
        if (!message.isAction) {
            // The username.
            let userStr = '[' + message.user + ']: ';
            x += this.context.measureText(userStr).width;
        }

        // The other messages.
        let wordsOnLine = message.isAction ? 0 : 1;
        const words = message.message.split(' ');
        let line = '';
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const width = this.context.measureText(testLine).width;
            if (x + width > this.getWidth() - this.padding[2] && wordsOnLine > 0) {
                y += this.lineHeight;
                line = words[i] + ' ';
                x = this.padding[0];
                wordsOnLine = 0;
            }
            else {
                wordsOnLine++;
                line = testLine;
            }
        }
        y += this.lineHeight;
    }
    return y;
};

ChannelChat.prototype.getWidth = function () {
    return this.width;
};

ChannelChat.prototype.getHeight = function () {
    return this.height;
};

module.exports = ChannelChat;