#!/usr/bin/env bash
set -e

# Nyay Saathi PWA Icon Generation Script
# Re-generates standard 192x192, 512x512, maskable and iOS apple-touch-icon PNGs.

echo "Generating Nyay Saathi PWA Icons..."
python3 "$(dirname "$0")/generate_png_icons.py"
cp -f public/icons/apple-touch-icon.png public/apple-touch-icon.png
echo "PWA icons successfully generated in public/icons and public/!"
