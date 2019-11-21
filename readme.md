place keyframes in /keyframes folder
structure:
/keyframes/<video>/<video>_<keyframe>_key.jpeg
/keyframes/00000/00000_0000000_key.jpeg




to use yolo9000, download the weights first:
cd cfg
wget https://github.com/philipperemy/yolo-9000/raw/master/yolo9000-weights/xaa
wget https://github.com/philipperemy/yolo-9000/raw/master/yolo9000-weights/xab
cat yolo9000-weights/x* > yolo9000-weights/yolo9000.weights
rm xaa
rm xab
