const Channel = require('./channel');
const { loadImage } = require('canvas');

const ChannelHeader = function (streamSettings, x, y, width, height, backgroundColor, src) {
    this.width = width;
    this.height = height;
    Channel.call(this, streamSettings, x, y);

    this.context.fillStyle = backgroundColor;
    this.context.fillRect(0, 0, this.getWidth(), this.getHeight());
    loadImage(src).then((img) => {
        this.context.drawImage(img, 0, 0);
        this.dirty = true;
    });
};
ChannelHeader.prototype = Object.create(Channel.prototype);

ChannelHeader.prototype.getWidth = function () {
    return this.width;
};

ChannelHeader.prototype.getHeight = function () {
    return this.height;
};

module.exports = ChannelHeader;