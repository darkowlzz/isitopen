var Prompt = require('prompt-improved');
var request = require('request-json');
var prompt = new Prompt();
var client = request.newClient('http://localhost:3000/');

console.log('I need the following info to create a new user');
prompt.ask([
  {
    question: 'username',
    key: 'username',
    required: true
  }
], function(err, res) {
  if (err) return console.error(err);
  console.log('Creating a new user ' + res.username);

  var aUser = {
    username: res.username
  };

  console.log('Sending a req to the db...');
  client.post('user/create', aUser, function(err, res, body) {
    console.log(res.body);
    console.log(res.statusCode);
  });
});
