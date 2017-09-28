var http = require('http'),
    httpProxy = require('http-proxy');

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function(req, res) {
  if (req.url.startsWith("/api/")) {
    console.log("API: " + req.url);
    req.url = req.url.slice(4);  // remove "/api"
    proxy.web(req, res, { target: 'http://127.0.0.1:1234' });
  } else if (req.url.startsWith("/files/")) {
    console.log("FILES: " + req.url);
    req.url = req.url.slice(6);  // remove "/files"
    proxy.web(req, res, { target: 'http://127.0.0.1:1235' });
  } else {
    console.log("SITO: " + req.url);
    proxy.web(req, res, { target: 'http://127.0.0.1:3000' });
  }
});

console.log("listening on port 5050");
server.listen(5050);
