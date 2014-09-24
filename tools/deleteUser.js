var Prompt = require('prompt-improved');
var request = require('request-json');
var prompt = new Prompt();
var client = request.newClient('http://localhost:3000/');

console.log('I need the following info to delete a user');
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
  }
], function(err, res) {
  if (err) return console.log(err);

  var aUser = {
    username: res.username,
    apikey: res.apikey
  };

  console.log('Sending a req to the db...');
  client.post('user/remove', aUser, function(err, res, body) {
    console.log(body);
    console.log(res.statusCode);
  });
});
