#!/bin/sh

if [ $# -gt 0 ]; then
  exec "$@"
else
  exec bun run app.ts
fi
