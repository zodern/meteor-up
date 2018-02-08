# Run when the docker image doesn't support prepare-bundle.sh
# Removes the latest image, so the start script will use the bundle instead
sudo docker rmi mup-<%= appName %>:latest || true
