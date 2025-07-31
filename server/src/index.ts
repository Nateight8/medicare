import { createServer } from "./graphql/server";

const PORT = process.env.PORT || 4000;

async function start() {
  const { app, httpServer } = await createServer();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

start();
