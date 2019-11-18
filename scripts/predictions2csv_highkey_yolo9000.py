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
net = dn.load_net(bytes('cfg/yolo9000.cfg', encoding="utf-8"), bytes('cfg/yolo9000.weights', encoding="utf-8"), 0)
meta = dn.load_meta(bytes("cfg/combine9k.data", encoding="utf-8"))

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


	csvName = classificationPath + '/' + afilename[0] + '/' + '_'.join(afilename[:2]) + '_cnn_yolo.csv'
	if os.path.exists(csvName):
		return

	if afilename[2] == 'highkey.jpg':
		# dn.detect(net, meta, image, thresh=.5, hier_thresh=.5, nms=.45)
		yoloResult = dn.detect(net, meta, bytes(fullpath, encoding="utf-8"), .1, .2) # thresh=.1 for yolo9000
		pprint(yoloResult)
		categories, props, boundingBoxes = getCategories(yoloResult, True)

		if len(categories) > 0:

			count = 0
			f= open(csvName,'w+')
			f.write(str(len(categories)))
			for category in categories:
				#2Do: second and following are failing..
				# pprint(category)
				index = names.index(str(category, 'utf-8'))

				# parent id, cat id, count, probability, boundingBox of best match (when more than 1 objects of same type are found)
				f.write(',' + str(tree[index][1]) + ',' + str(index) + ',' + str(categories[category]) + ',' + str(props[category]))

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



def fileTree2Array(filename):
	with open(filename) as f:
		line = f.readline().rstrip("\n")
		cnt = 1
		temp = []
		while line:
			lineArray = line.strip().split(" ") # [categoryName, parentId]
			temp.append([lineArray[0], int(lineArray[1])])
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

names = fileLines2Array('data/9k.names')
# labels = fileLines2Array('data/9k.labels')
tree = fileTree2Array('data/9k.tree')


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
