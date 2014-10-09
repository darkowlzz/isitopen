// Parse a string number, split and return an array consisting of numbers.
exports.getNumberArray = function(strArray) {
  var numArray = strArray.split(',');
  for (var i = 0; i < numArray.length; i++)
    numArray[i] = parseFloat(numArray[i]);
  return numArray;
};
