#!/usr/bin/python3

# usage: ./csv2json.py <folder> <synsetFolder> > file.json
# folder: contains subfolders which contain .csv files
# csv files names: <videonumber>_<framenumber>_<classification_name>.csv
#
# example: ./csv2json.py ~/diveXplore/data/classifications ~/diveXplore/concepts > /tmp/test.json

import sys, os, json

# only store best x concepts of each net for each keyframe
numBestProbabilities = 5

synsets = {}

def floatformat(string):
	return '{0:.7f}'.format(float(string))

def line2tupel(line):
	temp = []
	parts = line.split(",")
	for category, probability in zip( parts[0::2], map(floatformat, parts[1::2]) ):
		temp.append([category, probability])

        # sort by second value (probability) with sorted
        # only return best x concepts
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
	    sys.stdout.write('"nodeType": "keyframe", ')
	    sys.stdout.write('"video": {0}, "keyframe": {1}, "net": "{2}"'.format(int(afilename[0]), int(afilename[1]), netName))
	    sys.stdout.write(', "category": {0}, "probability": {1}'.format(entry[0], entry[1]))
	    sys.stdout.write(', "categoryName": "{0}"'.format(synsets[netName][int(entry[0])]))
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
		synsets.update({afilename[0]: temp})

# end create synset array


sys.stdout.write("{")
sys.stdout.write('"delete": {"query": "nodeType:keyframe"}')

walk = walkRootFilename(sys.argv[1], True)

counter = 0
for root, filename in walk:
	sys.stdout.write(",")
	printFile(root, filename, synsets)

	counter += 1
	sys.stderr.write("\r{0}".format(counter))

sys.stdout.write(', "commit": {} }')
