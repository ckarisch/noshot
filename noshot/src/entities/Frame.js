class Frame {
  constructor(second, fps, url) {
    this.second = second;
    this.fps = fps;
    this.number = Math.floor(this.second * this.fps);
    this.url = url;
    this.canvas = null;
  }
}

export default Frame;
