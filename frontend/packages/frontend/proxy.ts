/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import http from "http";
import httpProxy from "http-proxy";

const bareBackend = process.env.BARE_BACKEND !== undefined;
const siteEndpoint = "http://127.0.0.1:3000";
const apiEndpoint = bareBackend ? "http://127.0.0.1:1234" : "http://127.0.0.1:2000/api";
const filesEndpoint = bareBackend ? "http://127.0.0.1:1235" : "http://127.0.0.1:2000/files";

if (bareBackend) {
  console.log("\x1b[1mUsing bare backend\x1b[0m");
} else {
  console.log("\x1b[1mUsing docker backend\x1b[0m");
}
console.log(`  - API endpoint: ${apiEndpoint}`);
console.log(`  - Files endpoint: ${filesEndpoint}`);

const proxy = httpProxy.createProxyServer({ xfwd: true });

const server = http.createServer((req, res) => {
  if (req.url === undefined) {
    return;
  }

  if (req.url.startsWith("/api/")) {
    console.log(`API: ${req.url}`);
    req.url = req.url.slice(4); // remove "/api"
    proxy.web(req, res, { target: apiEndpoint });
  } else if (req.url.startsWith("/files/")) {
    console.log(`FILES: ${req.url}`);
    req.url = req.url.slice(6); // remove "/files"
    proxy.web(req, res, { target: filesEndpoint });
  } else {
    console.log(`SITE: ${req.url}`);
    proxy.web(req, res, { target: siteEndpoint });
  }
});

proxy.on("error", (err, req, res) => {
  res.writeHead(502, { "Content-Type": "text/plain" });
  res.end("Some of the services are down!");
  console.error(err.toString());
});

server.on("upgrade", (req, res) => {
  proxy.ws(req, res, { target: "ws://127.0.0.1:3000", ws: true });
});

console.log("Listening on port 9000");
server.listen(9000);
