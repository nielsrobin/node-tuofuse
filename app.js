var express = require('express')
  , app = express()
  , http = require('http')
  , path = require('path')

var publicDir = __dirname + '/public'

app.use(express.static(publicDir))
app.locals.pretty = true

app.get('/', function(req, res) {
  res.sendfile(path.join(publicDir, 'index.html'))
})

var server = http.createServer(app)
server.listen(process.env.PORT || 3000);