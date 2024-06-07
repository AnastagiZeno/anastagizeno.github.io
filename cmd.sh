#!/bin/bash

function launch() {
    hugo --gc; hugo --cleanDestinationDir; hugo -d public
}

function new_post() {
    if [ -n "$1" ]; then
        hugo new content/archive/"$1".md
    else
        hugo new content/archive/$(date +%Y%m%d).md
    fi
}

function deploy() {
    git status; sleep 0.8; git add .; git commit -m "tick-tock"; sleep 0.5; git push
    cd public/ || exit; git status; sleep 0.8; git add .; git commit -m "tick-tock"; sleep 0.5; git push
    cd ..
    echo "ok"
}

# Show usage if no arguments are passed.
if [ $# -eq 0 ]; then
    echo "Usage: $0 [-n [post-name]] [-l] [-d]"
    echo "-n [post-name]: Create a new post. If no post name is given, the current date is used."
    echo "-d: Deploy the site."
    echo "-l: Launch the site."

    echo "are we clear?"
    exit 1
fi

while getopts ":n:ld" opt; do
    case ${opt} in
        n )
            new_post "$OPTARG"
            ;;
        l )
            launch
            ;;
        d )
            deploy
            ;;
        \? )
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
        : )
            echo "Option -$OPTARG requires an argument." >&2
            exit 1
            ;;
    esac
done
shift $((OPTIND -1))

