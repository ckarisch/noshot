#!/usr/bin/python3

# usage: ./csv2json.py <folder> > file.json
# folder: contains subfolders which contain .csv files
# csv files names: <videonumber>_<framenumber>_<classification_name>.csv
#
# example: ./csv2json.py ~/diveXplore/data/classifications > /tmp/test.json

import sys, os, json

# only store best x concepts of each net for each keyframe
numBestProbabilities = 10

def floatformat(string):
	return '{0:.7f}'.format(float(string))

def line2dict(line):
	temp = []
	parts = line.split(",")
	for category, probability in zip( parts[0::2], map(floatformat, parts[1::2]) ):
		temp.append([category, probability])

        # sort by second value (probability) with sorted
        # only return best x concepts
	return dict(sorted(temp, key=lambda tup: tup[1])[:numBestProbabilities])

def file2json(filename):
	with open(filename) as f:
		line = f.readline().rstrip("\n")
		return json.dumps(line2dict(line))

def printFile(root, filename):
	fullpath = os.path.join(root, filename)
	afilename = filename.split("_")
	netName = "_".join(afilename[2:]).split(".")[0]
	jsonStr = file2json(fullpath)

	sys.stdout.write('"add": { "doc": {')
	sys.stdout.write('"nodeType": "keyframe", ')
	#sys.stdout.write('"video": {0}, "keyframe": {1}, "net": "{2}"'.format(int(afilename[0]), int(afilename[1]), netName))
	#sys.stdout.write(', "{0}":{1}'.format(netName, jsonStr))
	sys.stdout.write('"video": {0}, "keyframe": {1}, "net": "{2}"'.format(int(afilename[0]), int(afilename[1]), netName))
	sys.stdout.write(', {0}'.format(jsonStr[1:-1]))
	sys.stdout.write('}}')

def walkRootFilename(directory):
	walk = os.walk(directory)
	next(walk) #skip directory itself
	for root, dirs, files in walk:
		for filename in files:
			yield root, filename

sys.stdout.write("{")
sys.stdout.write('"delete": {"query": "nodeType:keyframe"}')

walk = walkRootFilename(sys.argv[1])

#printFile(*next(walk))
start = 0
end = 200000
counter = 0
for root, filename in walk:
	if(counter < start): continue

	sys.stdout.write(",")
	printFile(root, filename)

	if(counter >= end):
		break
	counter += 1
	sys.stderr.write("\r{0}".format(counter))

sys.stdout.write(', "commit": {} }')

