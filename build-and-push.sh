#!/bin/bash
set -e

IMAGE="dimaspmna/fe-oses-prod"
TAG="2.3.0"

echo "==> Building Docker image: $IMAGE:$TAG"
docker build -t $IMAGE:$TAG -t $IMAGE:latest .

echo "==> Pushing Docker image: $IMAGE:$TAG"
docker push $IMAGE:$TAG
docker push $IMAGE:latest

echo "==> Done! Image pushed: $IMAGE:$TAG"