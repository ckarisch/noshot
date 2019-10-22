# usage: ./predictions2csv.py <keyframeFolder> <videosFolder> <outputFolder>
# keyframeFolder: contains subfolders which contain keyframe.jpg files
# videosFolder: contains .mp4 files
# outputFolder: contains subfolders which contain .csv files
#
# example: ./predictions2csv.py ~/diveXplore/data/keyframes /media/christoph/Data/videos ~/diveXplore/data/classifications
# example: python ./predictions2csv.py ~/keyframes ~/videos ~/test-classifications

import sys, os
#sys.path.append(os.path.join(os.getcwd(),'python/'))

import darknet as dn
import pdb
import os
import subprocess

dn.set_gpu(0)
net = dn.load_net(bytes('cfg/yolov3.cfg', encoding="utf-8"), bytes('cfg/yolov3.weights', encoding="utf-8"), 0)
meta = dn.load_meta(bytes("cfg/coco.data", encoding="utf-8"))

def getCategories(yoloResult, best):
	categories = {}
	props = {}
	for category in yoloResult:
		if category[0] in categories:
			categories[category[0]] = categories[category[0]] + 1

			if best:
				if props[category[0]] < category[1]:
					props[category[0]] = category[1]
			else:
				if props[category[0]] > category[1]:
					props[category[0]] = category[1]
		else:
			categories[category[0]] = 1
			props[category[0]] = category[1]

	return [categories, props]


def printFile(root, filename, videoPath, classificationPath):
	fullpath = os.path.join(root, filename)
	afilename = filename.split("_")


	if os.path.exists(classificationPath + '/' + afilename[0]) == False:
		os.mkdir(classificationPath + '/' + afilename[0])


	csvName = classificationPath + '/' + afilename[0] + '/' + '_'.join(afilename[:2]) + '_cnn_googleyolo.csv'
	if os.path.exists(csvName):
		return

	if afilename[2] == 'key.jpg':
		#sys.stdout.write(' ' + fullpath + "\n")
		try:

			if os.path.exists("temp.jpg"):
				os.remove("temp.jpg")

			subprocess.call(['ffmpeg', '-loglevel', 'quiet', '-i', videoPath + '/' + afilename[0] + '.mp4', '-vf', 'select=eq(n\,' + str(int(afilename[1])) + ')', '-vframes', '1', 'temp.jpg'])
			if os.path.exists("temp.jpg"):
				yoloResult = dn.detect(net, meta, bytes("temp.jpg", encoding="utf-8"))

				categories, props = getCategories(yoloResult, True)

				if len(categories) > 0:

					count = 0
					f= open(csvName,'w+')
					for category in categories:
						if count > 0:
							f.write(',')
						f.write(str(names.index(str(category))) + ',' + str(props[category]))
						count += 1
		except:
			sys.stdout.write(' error: ' + fullpath + "\n")

def fileLines2Array(filename):
	with open(filename) as f:
		line = f.readline().rstrip("\n")
		cnt = 1
		temp = []
		while line:
			#print("Line {}: {}".format(cnt, line.strip()))
			temp.append(line.strip())
			line = f.readline()
			cnt += 1
		return temp

def walkRootFilename(directory, skipRoot):
	walk = os.walk(directory)
	if (skipRoot): next(walk) #skip directory itself
	for root, dirs, files in walk:
		for filename in files:
			yield root, filename



sys.stdout.write("starting\n")
if os.path.exists("temp.jpg"):
	os.remove("temp.jpg")




# create synset array
sys.stdout.write("load synset\n")

names = fileLines2Array('data/coco.names')

# end create synset array



sys.stdout.write("analyze images\n")
walk = walkRootFilename(sys.argv[1], True)

counter = 0
for root, filename in walk:
	printFile(root, filename, sys.argv[2], sys.argv[3])

	counter += 1

	sys.stderr.write("\r{0}".format(counter))

sys.stdout.write("\ndone\n")
