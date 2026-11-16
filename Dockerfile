FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs server-run.mjs index.html app.js sync.js sync-core.js desktop-ui.js slide-template.cjs sw.js style.css ./
COPY --chown=node:node assets ./assets
RUN mkdir /data && chown node:node /data
USER node
ENV HOST=0.0.0.0 PORT=8090 WUI_DATA_DIR=/data
EXPOSE 8090
CMD ["node", "server-run.mjs"]
