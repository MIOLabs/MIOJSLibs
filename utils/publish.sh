#!/bin/bash

cd _site
git add .
git commit -m 'Update documentation'
git push origin gh-pages
cd ..
