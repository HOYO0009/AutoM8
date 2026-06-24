import "dotenv/config";

import { createAutoM8App } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
const app = createAutoM8App();

app.listen(port, () => {
  console.log(`AutoM8 API listening on http://127.0.0.1:${port}`);
});
