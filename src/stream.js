const { createCanvas } = require('canvas');
const { spawn } = require('child_process');

const Stream = function (streamSettings) {
    this.streamSettings = streamSettings;
    this.channels = [];

    this.canvas = createCanvas(this.streamSettings.width, this.streamSettings.height);
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.frame = Uint8Array.from(Array(this.streamSettings.width * this.streamSettings.height * 4));

    this.process;
    this.writeFrameInterval;
};

Stream.prototype.addChannel = function (channel, args) {
    const ch = new channel(this.streamSettings, ...args);
    this.channels.push(ch);
    return ch;
};

Stream.prototype.removeChannel = function (channel) {
    const ind = this.channels.indexOf(channel);
    if (ind < 0) {
        throw new Error('tried to remove a channel that doesn\'t exist');
    }
    this.channels.splice(ind, 1);
}

Stream.prototype.startStream = function () {
    this.process = spawn('ffmpeg', [
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo', // TODO. Redundant?
        '-s', this.streamSettings.width + 'x' + this.streamSettings.height,
        '-pix_fmt', 'argb',
        '-r', this.streamSettings.framerate,
        '-i', '-',
        // '-stream_loop', '-1',
        // '-i', 'PATH_TO_YOUR_AUDIO_FILE.mp3',
        '-f', 'flv',
        '-vcodec', 'libx264',
        '-profile:v', 'main', // TODO. Do we need this?
        '-g', this.streamSettings.framerate * 2,
        '-keyint_min', this.streamSettings.framerate,
        '-b:v', this.streamSettings.bitrate,
        '-minrate', this.streamSettings.bitrate,
        '-maxrate', this.streamSettings.bitrate,
        '-pix_fmt', 'yuv420p', // Pretty sure this is necessary
        '-preset', 'ultrafast', //TODO: What does this do
        '-tune', 'zerolatency', //TODO: What does this do
        '-threads', '0', //TODO: What does this do
        '-bufsize', this.streamSettings.bitrate,
        this.streamSettings.out
    ]);
    console.log([
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo', // TODO. Redundant?
        '-s', this.streamSettings.width + 'x' + this.streamSettings.height,
        '-pix_fmt', 'argb',
        '-r', this.streamSettings.framerate,
        '-i', '-',
        // '-stream_loop', '-1',
        // '-i', 'PATH_TO_YOUR_AUDIO_FILE.mp3',
        '-f', 'flv',
        '-vcodec', 'libx264',
        '-profile:v', 'main', // TODO. Do we need this?
        '-g', this.streamSettings.framerate * 2,
        '-keyint_min', this.streamSettings.framerate,
        '-b:v', this.streamSettings.bitrate,
        '-minrate', this.streamSettings.bitrate,
        '-maxrate', this.streamSettings.bitrate,
        '-pix_fmt', 'yuv420p', // Pretty sure this is necessary
        '-preset', 'ultrafast', //TODO: What does this do
        '-tune', 'zerolatency', //TODO: What does this do
        '-threads', '0', //TODO: What does this do
        '-bufsize', this.streamSettings.bitrate,
        this.streamSettings.out
    ]);

    this.process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    this.process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    this.process.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    this.writeFrameInterval = setInterval(() => this.writeFrame(), 1000 / 30);
};

Stream.prototype.writeFrame = function () {
    this.process.stdin.write(this.getFrame());
};

Stream.prototype.getFrame = function () {
    for (channel of this.channels) {
        this.context.putImageData(channel.getFrame(), channel.getX(), channel.getY());
    }

    const imageData = this.context.getImageData(0, 0, this.streamSettings.width, this.streamSettings.height).data;
    for (let i = 0; i < this.streamSettings.width * this.streamSettings.height; i++) {
        this.frame[i * 4 + 0] = imageData[i * 4 + 3];
        this.frame[i * 4 + 1] = imageData[i * 4 + 0];
        this.frame[i * 4 + 2] = imageData[i * 4 + 1];
        this.frame[i * 4 + 3] = imageData[i * 4 + 2];
    }

    return this.frame;
};

module.exports = Stream;