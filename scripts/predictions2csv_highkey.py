# usage: ./predictions2csv.py <keyframeFolder> <outputFolder>
# keyframeFolder: contains subfolders which contain highkey.jpg files
# outputFolder: contains subfolders which contain .csv files
#
# example: python ./predictions2csv.py ~/diveXplore/data/keyframes ~/diveXplore/data/classifications

import sys, os

import darknet as dn
import pdb
import os
import subprocess

dn.set_gpu(0)
net = dn.load_net('cfg/yolov3.cfg', 'yolov3.weights', 0)
meta = dn.load_meta("cfg/coco.data")

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


def printFile(root, filename, classificationPath):
	fullpath = os.path.join(root, filename)
	afilename = filename.split("_")


	if os.path.exists(classificationPath + '/' + afilename[0]) == False:
		os.mkdir(classificationPath + '/' + afilename[0])


	csvName = classificationPath + '/' + afilename[0] + '/' + '_'.join(afilename[:2]) + '_cnn_googleyolo.csv'
	if os.path.exists(csvName):
		return

	if afilename[2] == 'highkey.jpg':
		try
			yoloResult = dn.detect(net, meta, filename)

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


# create synset array
sys.stdout.write("load synset\n")

names = fileLines2Array('data/coco.names')

# end create synset array



sys.stdout.write("analyze images\n")
walk = walkRootFilename(sys.argv[1], True)

counter = 0
for root, filename in walk:
	printFile(root, filename, sys.argv[2])

	counter += 1

	sys.stderr.write("\r{0}".format(counter))

sys.stdout.write("\ndone\n")
