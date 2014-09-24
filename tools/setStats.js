var Prompt = require('prompt-improved');
var request = require('request-json');
var prompt = new Prompt();
var client = request.newClient('http://localhost:3000/');

console.log('Tell me the values you want to set');
prompt.ask([
  {
    question: 'idCounter',
    key: 'idCounter',
  },
  {
    question: 'placeCount',
    key: 'placeCount'
  },
  {
    question: 'userCount',
    key: 'userCount'
  }
], function(err, res) {
  if (err) return console.log(err);

  var counts = {
    idCounter: res.idCounter,
    placeCount: res.placeCount,
    userCount: res.userCount
  };

  console.log('we have');
  console.log('idCounter: ' + counts.idCounter);
  console.log('placeCount: ' + counts.placeCount);
  console.log('userCount: ' + counts.userCount);

  client.post('/stats/set', counts, function(err, res, body) {
    console.log(body);
    console.log(res.statusCode);
  });
});
