var Prompt = require('prompt-improved');
var request = require('request-json');
var prompt = new Prompt();
var client = request.newClient('http://localhost:3000/');

console.log('I need the following info to add a new API key');
prompt.ask([
  {
    question: 'username',
    key: 'username',
    require: true
  },
  {
    question: 'apikey',
    key: 'apikey',
    require: true
  },
], function(err, res) {
  if (err) return console.log(err);

  var aUser = {
    username: res.username,
    apikey: res.apikey
  };

  client.post('user/gen-apikey', aUser, function(err, res, body) {
    console.log(body);
    console.log(res.statusCode);
  });
});
