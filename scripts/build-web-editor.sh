#!/bin/bash
mkdir -p assets/reader/editor

pnpx esbuild raw/web-editor.ts \
  --bundle \
  --format=iife \
  --global-name=CM6 \
  --minify \
  --outfile=assets/reader/editor/codemirror.js
