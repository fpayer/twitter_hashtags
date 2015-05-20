var Twitter = require('twitter');
var fs = require('fs');
var json2csv = require('json2csv');
var jf = require('jsonfile');
var async = require('async');

var client = new Twitter({
  consumer_key : 'Z4RhJ5emEPlAn6X1ym6C88IZb',
  consumer_secret: 'asxkh7S4if8mSiyYUKxnLQ5ezfoR43rUgMhLMk31whAQV4Yrln',
  access_token_key: '45164350-6P94b53oGKdWByk7VeG18lK7XCR1GW8hZMg8gugYK',
  access_token_secret: 'wcfIel6NQW0xScOxn1kdDpompYoKjiIYcFwoqThdvePuK'
});

var date = new Date();
var old_date = date;
var pr_date = '-' + (date.getMonth()+1) + '-' + date.getDate();
var params = { screen_name : 'nodejs'};
var prefix = './data/';

var ids = [
  {
    id : 1,
    area : 'Global'
  },
  {
    id : 23424977,
    area : 'USA'
  },
  {
    id : 23424975,
    area : 'UK'
  },
  {
    id : 23424768,
    area : 'Brazil'
  },
  {
    id : 23424868,
    area : 'South Korea'
  },
  {
    id : 23424852,
    area : 'Israel'
  },
  {
    id : 2487956,
    area : 'San Fran',
  },
  {
    id : 2514815,
    area : 'DC'
  }
];

//15 minutes
var seconds = 60 * 15;
//var seconds = 5;
var down = 0;

var counts = { };

var y = ids.length;
while (y--) {
  var id = ids[y];
  try {
    counts[id.area] = require(prefix + id.area + pr_date + '.json');
  } catch (err) {
    counts[id.area] = { };
  }
}

setInterval(function() {
  date = new Date();
  if (date.getDate() !== old_date.getDate()) {
    counts = { };
  }
  old_date = date;
  pr_date = '-' + (date.getMonth()+1) + '-' + date.getDate();
  async.mapSeries(ids, function(item, done) {
    var locationId = item.id;
    var area = item.area;

    async.waterfall([
      function(d) {
        client.get('trends/place', {id:locationId}, function(err, tweets, response) {
          if (err) {
            d(err);
          } else {
            var grab = tweets[0].trends;

            var x = 0;
            while (x < grab.length) {
              var name = grab[x].name.toLowerCase();
              var promoted = !!grab[x].promoted_content;

              if (counts[area][name]) {
                counts[area][name].count++;
                counts[area][name].promoted = promoted;
              } else {
                counts[area][name] = {
                  count : 1,
                  promoted : promoted
                }
              }
              x++;
            }
            d();
          }
        });
      }, 
      function(d) {
        var keys = Object.keys(counts[area]);
        var json = [ ];
        var length = keys.length;
        while (length--) {
          var key = keys[length];
          json.push({
            hashtag : key,
            count : counts[area][key].count,
            promoted : counts[area][key].promoted
          });
        }
        json2csv({data:json, fields : ['hashtag', 'count', 'promoted']}, function(err, csv) {
          if (err) {
            d(err);
          } else {
            fs.writeFile(prefix + area + pr_date + '.csv', csv, function(err) {
              d(err);
            });
          }
        });
      },
      function(d) {
        jf.writeFile(prefix + area + pr_date + '.json', counts[area], function(err) {
          d(err);
        });
      }
    ], function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Save ' + area);
      }
      done(err);
    });
  }, function(err) {
    console.log('Done');
  });
}, seconds * 1000);

setInterval(function() {
  down = (down + 1) % seconds;
  console.log((seconds - down) + ' seconds remaining');
}, 1000);
