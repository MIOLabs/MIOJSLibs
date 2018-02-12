#!/bin/bash
FOLDER='_site'
BRANCH='gh-pages'
mkdir $FOLDER
# Create an empty branch in $FOLDER folder
git checkout --orphan $BRANCH
git reset
git commit --allow-empty -m 'Initial commit'
git checkout --force master
git worktree add $FOLDER $BRANCH
printf "\n$FOLDER" >> .gitignore