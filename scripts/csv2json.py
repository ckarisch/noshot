#!/usr/bin/python3

# usage: ./csv2json.py <folder> > file.json
# folder: contains subfolders which contain .csv files
# csv files names: <videonumber>_<framenumber>_<classification_name>.csv
#
# example: ./csv2json.py ~/diveXplore/data/classifications > /tmp/test.json

import sys, os, json

def line2dict(line):
	result = {}
	parts = line.split(",")
	for category, probability in zip( parts[0::2], map(float, parts[1::2]) ):
		result[category] = probability
	return result

def file2json(filename):
	with open(filename) as f:
		line = f.readline().rstrip("\n")
		return json.dumps(line2dict(line))

def printFile(root, filename):
	fullpath = os.path.join(root, filename)
	jsonStr = file2json(fullpath)
	sys.stdout.write("\"{0}\":{1}".format(filename, jsonStr))

def walkRootFilename(directory):
	walk = os.walk(directory)
	next(walk) #skip directory itself
	for root, dirs, files in walk:
		for filename in files:
			yield root, filename

print("{")
walk = walkRootFilename(sys.argv[1])

printFile(*next(walk))
counter = 1
for root, filename in walk:
	sys.stdout.write(",")
	printFile(root, filename)
	counter += 1
	sys.stderr.write("\r{0}".format(counter))

print("}")
