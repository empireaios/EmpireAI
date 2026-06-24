FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript tsx --no-save && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install
COPY --from=base /app/dist ./dist
RUN mkdir -p data
EXPOSE 4000
CMD ["node", "dist/index.js"]
