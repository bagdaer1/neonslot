#!/bin/bash
# Helper script to copy Egyptian theme assets
cp "/Users/bagdaer/.gemini/antigravity/brain/c21e8929-7b39-4505-b1a8-d7e797b9e688/egyptian_symbols_1771448872383.png" "assets/symbols.png"
cp "/Users/bagdaer/.gemini/antigravity/brain/c21e8929-7b39-4505-b1a8-d7e797b9e688/egyptian_background_1771448889158.png" "assets/background.png"
echo "Assets copied successfully!"
rm -- "$0"  # Self-delete this script
