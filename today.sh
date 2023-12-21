#!/bin/bash
if [ $# -gt 0 ]; then 
    hugo new content archive/$1.md
else
    hugo new content archive/$(date +%Y%m%d).md
fi
