#!/bin/bash
git status;sleep 0.8;git add .;git commit -m "tick-tock";sleep 0.5;git push
cd public/;git status;sleep 0.8;git add .;git commit -m "tick-tock";sleep 0.5;git push
cd ..
echo "ok"
