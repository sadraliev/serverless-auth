#!/bin/bash

echo "🔨 Archiving handlers..."
mkdir -p zips

for dir in dist/*/; do
  handler=$(basename "$dir")
  echo "Archiving $handler..."
  (cd "$dir" && zip -r "../../zips/${handler}.zip" .)
done

echo "✅ All handlers are archived in zips/"
