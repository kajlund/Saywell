import http from 'node:http';

const url = 'http://127.0.0.1:3000/health';

const poll = () =>
  new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
  });

let ready = false;
for (let i = 0; i < 60 && !ready; i += 1) {
  ready = await poll();
  if (!ready) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

if (!ready) {
  console.error('API did not start in time.');
  process.exit(1);
}
