#!/usr/bin/python3

# usage: ./csv2json.py <folder> <synsetFolder> > file.json
# folder: contains subfolders which contain .csv files
# csv files names: <videonumber>_<framenumber>_<classification_name>.csv
# synsetFolder: line number = category number, line content = category name
# synset file names: <synsetName>-synset.txt
#
# example: ./csv2json.py ~/diveXplore/data/classifications ~/diveXplore/concepts > /tmp/test.json

import sys, os, json
from pprint import pprint

# only store best x concepts of each net for each keyframe
numBestProbabilities = 5

synsets = {}

def floatformat(string):
	return '{0:.7f}'.format(float(string))

def line2tupel(line):
	temp = []
	parts = line.split(",")
	del parts[0]

	# 2Do BUG WORKAROUND
	for i in range(int(len(parts) / 8)):
	#for i in range(1):
		temp.append([parts[i*8], parts[i*8+1], parts[i*8+2], parts[i*8+3], parts[i*8+4], parts[i*8+5], parts[i*8+6], parts[i*8+7]])

	return sorted(temp, key=lambda tup: tup[1])[:numBestProbabilities]

def file2json(filename):
	with open(filename) as f:
		line = f.readline().rstrip("\n")
		return line2tupel(line)

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

def printFile(root, filename, synsets):
	fullpath = os.path.join(root, filename)
	afilename = filename.split("_")
	netName = "_".join(afilename[2:]).split(".")[0]
	classes = file2json(fullpath)


	for entry in classes:
		sys.stdout.write('"add": { "doc": {')
		sys.stdout.write('"nodeType": {0}, '.format(int(1)))
		sys.stdout.write('"startSecond": {0}, "endSecond": {1}, '.format(int(afilename[1]), int(afilename[1])))
		sys.stdout.write('"video": {0}, "second": {1}, "net": "{2}", '.format(int(afilename[0]), int(afilename[1]), netName))
		sys.stdout.write('"count": {0}'.format(entry[2]))
		sys.stdout.write(', "parentCategory": {0}, "category": {1}, "probability": {2}'.format(entry[0], entry[1], entry[3]))
		sys.stdout.write(', "boundingBox": [{0}, {1}, {2}, {3}]'.format(entry[4], entry[5], entry[6], entry[7]))
		sys.stdout.write(', "categoryName": "{0}"'.format(synsets[netName][int(entry[1])]))
		sys.stdout.write('}}')

def walkRootFilename(directory, skipRoot):
	walk = os.walk(directory)
	if (skipRoot): next(walk) #skip directory itself
	for root, dirs, files in walk:
		for filename in files:
			yield root, filename



# create synset array

synsetWalk = walkRootFilename(sys.argv[2], False)
for root, filename in synsetWalk:
	afilename = filename.split("-")

	if(len(afilename) > 1 and afilename[1] == "synset.txt"):
		fullpath = os.path.join(root, filename)
		temp = fileLines2Array(fullpath)

		# 2Do: load synsets line by line into temp
		# category number is the line number

		synsets.update({afilename[0]: temp})

# end create synset array




sys.stdout.write("{")
sys.stdout.write('"delete": {"query": "*:*"}')

walk = walkRootFilename(sys.argv[1], True)

#printFile(*next(walk))
start = 0
end = 200000
counter = 0
for root, filename in walk:
	if(counter < start): continue

	sys.stdout.write(",")
	printFile(root, filename, synsets)

	#if(counter >= end):
	#	break
	counter += 1
	sys.stderr.write("\r{0}".format(counter))

sys.stdout.write(', "commit": {} }')
