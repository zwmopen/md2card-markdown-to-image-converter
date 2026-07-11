FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

RUN mkdir -p /data/md2card && chown -R pwuser:pwuser /app /data/md2card

USER pwuser

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV OUTPUT_DIR=/data/md2card

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
