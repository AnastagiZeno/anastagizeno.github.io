#!/bin/bash

function new_post() {
    if [ -n "$1" ]; then
        hugo new content/archive/"$1".md
    else
        hugo new content/archive/$(date +%Y%m%d).md
    fi
}

function deploy() {
    hugo --gc; hugo --cleanDestinationDir; hugo -d public
}

function launch() {
    echo -e "\nnow, launch site files to remote\n"
    git status; sleep 0.8; git add .; git commit -m "tick-tock"; sleep 0.5; git push
    cd public/ || exit; git status; sleep 0.8; git add .; git commit -m "tick-tock"; sleep 0.5; git push
    cd ..
    echo "we success, bye"
}

# Show usage if no arguments are passed.
if [ $# -eq 0 ]; then
    echo "Usage: $0 [-n [post-name]] [-l] [-d] [-x]"
    echo "-n [post-name]: Create a new post. If no post name is given, the current date is used."
    echo "-d: Deploy the site locally."
    echo "-l: Launch the site."
    echo "-x: Launch after deploy the site files."

    echo "are we clear?"
    exit 1
fi

while getopts ":n:ldx" opt; do
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
        x )
            deploy
            sleep 1
            launch
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

