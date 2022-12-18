# !/bin/sh

# Update 
apt-get update && apt-get upgrade -y

# Use wget to download the latest Google Chrome .deb package :
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Install chrome
apt install ./google-chrome-stable_current_amd64.deb -y

