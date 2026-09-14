import app from './app.js';
import { env } from './config/env.js';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`🚀 KiranaPro SaaS Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
});
