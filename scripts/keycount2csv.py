# Source:
# https://stackoverflow.com/questions/13503409/python-output-number-of-files-in-each-sub-directory-to-a-csv-file

import os
import csv

# Open the csv and write headers.
with open("Subject_Task_Count.csv",'wb') as out:
    outwriter = csv.writer(out)
    outwriter.writerow(['Directory','FilesInDir','FilesIncludingSubdirs'])

    # Track total number of files in each subdirectory by absolute path
    totals = {}

    # topdown=False iterates lowest level (leaf) subdirectories first.
    # This way I can collect grand totals of files per subdirectory.
    for path,dirs,files in os.walk('.',topdown=False):
        files_in_current_directory = len(files)

        # Start with the files in the current directory and compute a
        # total for all subdirectories, which will be in the `totals`
        # dictionary already due to topdown=False.
        files_including_subdirs = files_in_current_directory
        for d in dirs:
            fullpath = os.path.abspath(os.path.join(path,d))

            # On my Windows system, Junctions weren't included in os.walk,
            # but would show up in the subdirectory list.  this try skips
            # them because they won't be in the totals dictionary.
            try:
                files_including_subdirs += totals[fullpath]
            except KeyError as e:
                print 'KeyError: {} may be symlink/junction'.format(e)

        totals[os.path.abspath(path)] = files_including_subdirs
        outwriter.writerow([path,files_in_current_directory,files_including_subdirs])
