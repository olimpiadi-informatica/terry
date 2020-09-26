/* eslint-disable no-console */

import http from "http";
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer({ xfwd: true });

const server = http.createServer((req, res) => {
  if (req.url === undefined) {
    return;
  }

  if (req.url.startsWith("/api/")) {
    console.log(`API: ${req.url}`);
    req.url = req.url.slice(4); // remove "/api"
    proxy.web(req, res, { target: "http://127.0.0.1:1234" });
  } else if (req.url.startsWith("/files/")) {
    console.log(`FILES: ${req.url}`);
    req.url = req.url.slice(6); // remove "/files"
    proxy.web(req, res, { target: "http://127.0.0.1:1235" });
  } else {
    console.log(`SITE: ${req.url}`);
    proxy.web(req, res, { target: "http://127.0.0.1:3000" });
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

console.log("listening on port 9000");
server.listen(9000);
