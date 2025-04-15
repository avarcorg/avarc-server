FROM node:20-alpine

WORKDIR /app

# Copy all necessary files and directories
COPY .next .next
COPY node_modules node_modules
COPY public public
COPY config config
COPY utils utils
COPY server.js .
COPY next.config.js .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
