class Frame {
  constructor(second, fps) {
    this.second = second;
    this.fps = fps;
    this.number = this.second * this.fps;
  }
  // calc exact seconds from frame
  // toSeconds() {
  //   return (parseFloat(this.number) / this.fps).toFixed(3);
  // }
}

export default Frame;
