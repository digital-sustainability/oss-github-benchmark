FROM node:16-alpine as backendBuild

COPY oss-api/ ./

WORKDIR /oss-api

RUN npm install 

RUN npm run build

FROM node:16-alpine as prod

COPY --from=backendBuild dist dist

COPY --from=backendBuild node_modules/ dist/node_modules

ENV PORT=5000

ENV NODE_ENV=PRODUCTION

CMD ["node", "dist/main.js"]
