var Prompt = require('prompt-improved');
var request = require('request-json');
var prompt = new Prompt();

console.log('I need the following data to create a new place');
prompt.ask([
  {
    question: 'place',
    key: 'name',
    required: true
  },
  {
    question: 'location',
    key: 'location',
    required: true
  },
  {
    question: 'coordinates',
    key: 'coordinates',
    required: true
  },
  {
    question: 'apikey',
    key: 'apikey',
    required: true
  }
], function(err, res) {
  if (err) return console.error(err);
  console.log('Creating a new place with');
  console.log('name: ' + res.name);
  console.log('location: ' + res.location);
  console.log('coordinates: ' + res.coordinates);
  console.log('apikey: ' + res.apikey);

  var aPlace = {
    name: res.name,
    location: res.location,
    coordinates: res.coordinates,
    apikey: res.apikey
  };

  console.log('Sending a req to the db...');

  /*
  request(
    {
      method: 'POST',
      uri: 'localhost:3000/place/create',
      json: true,
      body: aPlace
    },
    function (error, response, body) {
      console.log(response.statusCode);
      console.log(body);
    }
  );
  */

  var client = request.newClient('http://localhost:3000/');
  client.post('place/create', aPlace, function(err, res, body) {
    console.log(res.body);
    console.log(res.statusCode);
  });

});
