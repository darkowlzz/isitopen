var Prompt = require('prompt-improved');
var request = require('request-json');
var prompt = new Prompt();
var client = request.newClient('http://localhost:3000/');

console.log('I need the following data to delete a place');
prompt.ask([
  {
    question: 'place',
    key: 'name',
    required: true
  },
  {
    question: 'apikey',
    key: 'apikey',
    required: true
  }
], function(err, res) {
  if (err) return console.log(err);

  var aPlace = {
    name: res.name,
    apikey: res.apikey
  };

  console.log('Sending a req to the db...');
  client.post('place/remove', aPlace, function(err, res, body) {
    console.log(body);
    console.log(res.statusCode);
  });
});
