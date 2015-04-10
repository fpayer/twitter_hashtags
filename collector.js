var fs = require('fs');
var async = require('async');
var path = './data/';

var master = { };
var limit = 5;
var promoted = false;

var builder = ['hashtag', 'promoted'];
if (!promoted) {
  builder.pop();
}

var jf = require('jsonfile');
var json2csv = require('json2csv');

var populate = function(keys) {
  var x = 0;
  var result = { };
  while (x < keys.length) {
    result[keys[x]] = 0;
    x++;
  }
  return result;
}

fs.readdir(path, function(err, files) {
  if (err) {
    console.error(err);
  } else {
    var y = 0;
    while (y < files.length) {
      if (/.json/.test(files[y])) {
        var split = files[y].split('-');
        var date = (split[1] + '-' + split[2]).split(/\./)[0];
        if (builder.indexOf(date) === -1) {
          builder.push(date);
        }
      }
      y++;
    }

    async.map(files, function(item, callback) {
      var split = item.split('-');
      var loc = split[0];
      var date = (split[1] + '-' + split[2]).split(/\./)[0];
      if (/.json/.test(item)) {
        fs.readFile(path + item, 'utf-8', function(err, data) {
          if (err) {
            console.log(err);
          } else {
            var json = JSON.parse(data);
            if (!master[loc]) {
              master[loc] = { };
            } 

            var locationMap = master[loc];
            var keys = Object.keys(json);
            var x = 0;
            while (x < keys.length) {
              var hashtag = keys[x];
              var count = json[hashtag];
              if (count.count >= limit) {
                if (!locationMap[hashtag]) {
                  locationMap[hashtag] = populate(builder);
                  locationMap[hashtag].hashtag = hashtag;
                  if (promoted) {
                    locationMap[hashtag].promoted = count.promoted;
                  }
                }
                locationMap[hashtag][date] = count.count;
              }
              x++;
            }
          }
          callback();
        });
      } else {
        callback();
      }
    }, function(err) {
        var keys = Object.keys(master);
        async.map(keys, function(key, d) {
          var hash_dict = master[key];
          var hashtags = Object.keys(hash_dict);
          var y = 0;
          
          var to_write = [ ];

          while (y < hashtags.length) {
            var hashtag = hashtags[y];
            var dat = hash_dict[hashtag];
            to_write.push(dat);
            y++;
          }

          json2csv({data:to_write, fields : builder}, function(err, csv) {
            if (err) {
              d(err);
            } else {
              fs.writeFile(path + key + '.csv', csv, function(err) {
                d(err);
              });
            }
          });
        });
    });
  }
});
