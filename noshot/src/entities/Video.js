class Video {
  constructor(id, frame, pos) {
    this.id = id;
    this.frame = frame;
    this.pos = pos;
  }
  getUniqueID() {
    return "#" + this.id + '_' + this.frame.second;
  }
}

export default Video;
