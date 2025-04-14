FROM node:20-alpine

WORKDIR /app

# Copy only the necessary files
COPY .next .next
COPY node_modules node_modules
COPY public public
COPY server.js .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
