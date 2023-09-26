const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 8080; // assign a port
app.get('/', (req, res) => {
    res.redirect('/about');
  });
  app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/views/about.html");
  });
app.use(express.static('public'));

// start the server on the port and output a confirmation ot the console
app.listen(HTTP_PORT, () => console.log(`Express http server listening on: ${HTTP_PORT}`));