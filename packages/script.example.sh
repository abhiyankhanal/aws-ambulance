#!/bin/bash

export AWS_ACCESS_KEY_ID="replace_this"
export AWS_SECRET_ACCESS_KEY="replace_this"
export AWS_SESSION_TOKEN="replace_this"

npm run build
node ./build/index.js -l test