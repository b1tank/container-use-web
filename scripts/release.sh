#!/bin/bash

pnpm version patch

git push origin $(git describe --tags --abbrev=0)
