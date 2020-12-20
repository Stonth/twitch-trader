const Channel = require('./channel');

const ChannelBackground = function (streamSettings, x, y, color) {
    Channel.call(this, streamSettings, x, y);

    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.getWidth(), this.getHeight());
};
ChannelBackground.prototype = Object.create(Channel.prototype);

ChannelBackground.prototype.getWidth = function () {
    return this.streamSettings.width;
};

ChannelBackground.prototype.getHeight = function () {
    return this.streamSettings.height;
};

module.exports = ChannelBackground;