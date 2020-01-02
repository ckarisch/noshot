#!/bin/bash

#gnome-terminal --window-with-profile=Bash ls
gnome-terminal --window-with-profile=Bash -e $PWD/start_query_server.sh --title="Query Server"
gnome-terminal --window-with-profile=Bash -e $PWD/start_app.sh --title="Vue App"
