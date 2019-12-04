#!/bin/bash

if [ $# -ne 1 ]; then
    echo "usage: ./import_json_file_to_solr.sh [IMPORT_FILE]"
    echo "encapsule paths within '' if they contain spaces"
    exit 1
fi

args=("$@")
IN_FILE="${args[0]}"

curl -X POST -H 'Content-Type: application/json' 'http://localhost:8983/solr/core1/update' --data-binary @"${IN_FILE}"
