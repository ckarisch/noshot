# usage: ./predictions2csv.py <keyframeFolder> <outputFolder>
# keyframeFolder: contains subfolders which contain highkey.jpg files
# outputFolder: contains subfolders which contain .csv files
#
# example: python3 ./predictions2csv_highkey.py skipRoot ~/diveXplore/data/keyframes ~/diveXplore/data/classifications
# example: python3 ./predictions2csv_highkey.py includeRoot ~/diveXplore/data/keyframes/00001 ~/diveXplore/data/classifications

import sys, os

import darknet as dn
import pdb
import os
import subprocess
from pprint import pprint

dn.set_gpu(0)
net = dn.load_net(bytes('cfg/yolov3.cfg', encoding="utf-8"), bytes('cfg/yolov3.weights', encoding="utf-8"), 0)
meta = dn.load_meta(bytes("cfg/coco.data", encoding="utf-8"))

def getCategories(yoloResult, best):
	categories = {}
	props = {}
	boundingBoxes = {}
	for category in yoloResult:
		if category[0] in categories:
			categories[category[0]] = categories[category[0]] + 1

			if best:
				if props[category[0]] < category[1]:
					props[category[0]] = category[1]
					boundingBoxes[category[0]] = category[2]

			else:
				if props[category[0]] > category[1]:
					props[category[0]] = category[1]
					boundingBoxes[category[0]] = category[2]
		else:
			categories[category[0]] = 1
			props[category[0]] = category[1]
			boundingBoxes[category[0]] = category[2]

	return [categories, props, boundingBoxes]


def printFile(root, filename, classificationPath):
	fullpath = os.path.join(root, filename)
	afilename = filename.split("_")


	if os.path.exists(classificationPath + '/' + afilename[0]) == False:
		os.mkdir(classificationPath + '/' + afilename[0])


	csvName = classificationPath + '/' + afilename[0] + '/' + '_'.join(afilename[:2]) + '_cnn_googleyolo.csv'
	if os.path.exists(csvName):
		return

	if afilename[2] == 'highkey.jpg':
		yoloResult = dn.detect(net, meta, bytes(fullpath, encoding="utf-8"))

		categories, props, boundingBoxes = getCategories(yoloResult, True)

		if len(categories) > 0:

			count = 0
			f= open(csvName,'w+')
			f.write(str(len(categories)))
			for category in categories:
				#2Do: second and following are failing..
				# pprint(category)

				# cat id, count, probability, boundingBox of best match (when more than 1 objects of same type are found)
				f.write(',' + str(names.index(str(category, 'utf-8'))) + ',' + str(categories[category]) + ',' + str(props[category]))

				for b in boundingBoxes[category]:
					# b = x,y,w,h
					f.write(',' + str(b))
				count += 1

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


# create synset array
sys.stdout.write("load synset\n")

names = fileLines2Array('data/coco.names')

# end create synset array



sys.stdout.write("analyze images\n")
skipRoot = False;
type = sys.argv[1];
if(type == "skipRoot"):
	skipRoot = True;

walk = walkRootFilename(sys.argv[2], skipRoot)

counter = 0
for root, filename in walk:
	printFile(root, filename, sys.argv[3])

	counter += 1

	sys.stderr.write("\r{0}".format(counter))

sys.stdout.write("\ndone\n")
