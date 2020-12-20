const {createCanvas} = require('canvas');

const Channel = function (streamSettings, x, y) {
    this.streamSettings = streamSettings;
    this.x = x;
    this.y = y;

    this.canvas = createCanvas(this.getWidth(), this.getHeight());
    this.context = this.canvas.getContext('2d');

    this.frame;
    this.dirty = true;
};

// Overwrite this!
Channel.prototype.getWidth = function () {
    return 0;
};

// Overwrite this!
Channel.prototype.getHeight = function () {
    return 0;
};

Channel.prototype.getX = function () {
    return this.x;
};

Channel.prototype.getY = function () {
    return this.y;
};

Channel.prototype.getFrame = function () {
    if (this.dirty) {
        this.frame = this.context.getImageData(0, 0, this.getWidth(), this.getHeight());
    }
    this.dirty = false;
    return this.frame;
};

module.exports = Channel;