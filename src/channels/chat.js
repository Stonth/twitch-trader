const Channel = require('./channel');
const {createCanvas} = require('canvas');

const ChannelChat = function (streamSettings, x, y, width, height, backgroundColor, userColor, messageColor, font, lineHeight, maxMessages) {
    this.width = width;
    this.height = height;
    Channel.call(this, streamSettings, x, y);
    this.backgroundColor = backgroundColor;
    this.messageColor = messageColor;
    this.userColor = userColor;
    this.lineHeight = lineHeight;
    this.maxMessages = maxMessages;

    this.messages = [];
    
    this.messageCanvas = createCanvas(this.getWidth(), this.getHeight());
    this.messageContext = this.messageCanvas.getContext('2d');
    this.messageContext.textBaseline = 'top';
    this.messageContext.font = font;
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

ChannelChat.prototype.redraw = function () {
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.getWidth(), this.getHeight());

    if (this.messages.length > 0) {
        this.messageContext.fillStyle = this.backgroundColor;
        this.messageContext.fillRect(0, 0, this.getWidth(), this.getHeight());

        let y = 0;
        for (message of this.messages.reverse()) {
            // First, write the username.
            this.messageContext.fillStyle = this.userColor;
            let userStr = '[' + message.user + ']: ';
            this.messageContext.fillText(userStr, 0, y);
            let x = this.messageContext.measureText(userStr).width;

            // Write the other messages.
            this.messageContext.fillStyle = this.messageColor;
            let wordsOnLine = 1;
            const words = message.message.split(' ');
            let line = '';
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const width = this.messageContext.measureText(testLine).width;
                if (x + width > this.getWidth() && wordsOnLine > 0) {
                    this.messageContext.fillText(line, x, y);
                    y += this.lineHeight;
                    line = words[i] + ' ';
                    x = 0;
                    wordsOnLine = 0;
                }
                else {
                    wordsOnLine++;
                    line = testLine;
                }
            }
            this.messageContext.fillText(line, x, y);
            y += this.lineHeight;
        }

        this.context.putImageData(this.messageContext.getImageData(0, 0, this.getWidth(), y), 0, this.getHeight() - y);
    }

    this.dirty = true;
};

ChannelChat.prototype.getWidth = function () {
    return this.width;
};

ChannelChat.prototype.getHeight = function () {
    return this.height;
};

module.exports = ChannelChat;