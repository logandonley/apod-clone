FROM oven/bun:1

WORKDIR /usr/src/app

COPY package.json bun.lockb ./

RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["bun", "run", "app.ts"]
