FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npx tsc -b && npx vite build
EXPOSE 3001
CMD ["npm", "start"]
