FROM node:latest
# Define working directory and copy source
WORKDIR /app
# copy everything
COPY . .
# npm install
RUN npm install
# Make bootstrap script executable
# RUN chmod +x ./bootstrap.sh
# Bootstrap
# RUN ./bootstrap.sh
# start service
CMD [ "npm", "start" ]
