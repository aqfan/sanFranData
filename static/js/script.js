"use strict";

var map, heatmap_freq, heatmap_urgency, geocoder;

var medChart = true, railChart = true;

// Initiales the map
function initMap() {
  map = new google.maps.Map(document.getElementById('heatmap'), {
    zoom: 13,
    center: {lat: 37.7749, lng: -122.4194},
    mapTypeId: 'roadmap',
    gestureHandling: 'cooperative'
  });

  geocoder = new google.maps.Geocoder();
}

// Gets heatmap frequency data from csv
function getFreqPoints(data) {
  var arr = new google.maps.MVCArray();
  for (var i = 0; i < 10000; i++) {
    var coordinate = data[i];
    var lat = parseFloat(coordinate.latitude);
    var lgn = parseFloat(coordinate.longitude);
    arr.push(new google.maps.LatLng(lat, lgn));
  }
  return arr;
}

// Gets heatmap urgency data from csv
function getUrgencyPoints(data) {
  var arr = new google.maps.MVCArray();
  for (var i = 0; i < 10000; i++) {
    var coordinate = data[i];
    var lat = parseFloat(coordinate.latitude);
    var lgn = parseFloat(coordinate.longitude);
    var weight = 1;
    if(parseInt(coordinate.final_priority) == 2) {
      weight = 1;
    } else {
      weight = 30;
    }
    arr.push({"location": new google.maps.LatLng(lat, lgn), "weight": weight});
  }
  return arr;
}

// Geocodes address
function geocodeAddress(geocoder, data) {
  var address = $('#address').val();
  var time = $('#time').val();
  if (address != "" && time != "") {
    geocoder.geocode({'address': address}, function(results, status) {
      if (status === 'OK') {
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();

        //finds datasets within 0.05 degrees of longitude and lattitude and 30 min
        //roughly 3.5 mile radius
        var closest = [];

        for (var i = 0; i < data.length; i++) {
          var temp = data[i];
          var data_time = temp.received_timestamp.substring(10);
          var parts_data = data_time.toString().split(':');
          var parts = time.split(':');
          var time_difference = Math.abs(parseInt(parts[0]) - parseInt(parts_data[0]))*60 + Math.abs(parseInt(parts[1]) - parseInt(parts_data[1]));
          if (Math.abs(temp.latitude - lat) <= 0.05 && Math.abs(temp.longitude - lng) <= 0.01 && time_difference <= 30) {
            closest.push(temp);
          }
        }

        if (closest.length == 0) {
          $('#estimation').text("Sorry! There isn't enough data to estimate for this address. Please try something else in San Francisco!");
          return;
        }

        //finds the values to predict
        var call_type = {};
        var unit_type = {};
        var time_taken_sum = {};
        var time_taken_count = {};

        for (var i = 0; i < closest.length; i++) {
          var temp = closest[i];
          call_type[temp.call_type] = (call_type[temp.call_type] || 0) + 1;
          unit_type[temp.unit_type] = (unit_type[temp.unit_type] || 0) + 1;
          if (temp.difference >= 0) {
            time_taken_sum[temp.call_type] = (time_taken_sum[temp.call_type] || 0) + temp.difference;
            time_taken_count[temp.call_type] = (time_taken_count[temp.call_type] || 0) + 1;
          }
        }

        call_type = Object.keys(call_type).sort(function(a,b){return call_type[b]-call_type[a]})
        unit_type = Object.keys(unit_type).sort(function(a,b){return unit_type[b]-unit_type[a]})

        //shows predictions
        $('#estimation').text("Predicted dispatch based on " + closest.length +" calls:");
        $('#call_type').text(call_type[0]);
        $('#time_taken').text((time_taken_sum[call_type[0]] / time_taken_count[call_type[0]]).toFixed(2));
        $('#unit_type').text(unit_type[0]);

      } else {
        $('#estimation').text("Please enter valid address!");
      }
    });
  } else {
    $('#estimation').text("Please don't leave any fields blank!");
  }

}

$(document).ready(() => {
  $.getJSON('/data').done(function(data) {

    //Creates HeatMaps
    heatmap_freq = new google.maps.visualization.HeatmapLayer({
      data: getFreqPoints(data),
    });

    heatmap_urgency = new google.maps.visualization.HeatmapLayer({
      data: getUrgencyPoints(data),
    });
    heatmap_freq.setMap(map);

    $('#frequencyMap').on('click', function() {
      $('#map_type').text("frequency");
      heatmap_freq.setMap(map);
      heatmap_urgency.setMap(null);
    });

    $('#urgencyMap').on('click', function() {
      $('#map_type').text("urgency");
      heatmap_freq.setMap(null);
      heatmap_urgency.setMap(map);
    });

    //Estimate dispatch with address and time
    $('#submit').on('click', function() {
      geocodeAddress(geocoder, data);
    });

    //Create call final disposition chart
    var call_types_label = [];
    var call_types_data = [];
    var num_call_types = {};
    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      num_call_types[temp.call_type] = (num_call_types[temp.call_type] || 0) + 1;
    }
    var sorted_call_types = Object.keys(num_call_types).sort(function(a,b){return num_call_types[b]-num_call_types[a]})
    for(var i in sorted_call_types) {
      call_types_label.push(sorted_call_types[i]);
      call_types_data.push(num_call_types[sorted_call_types[i]]);
    }
    var call_types = new Chart("call_type_count_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: call_types_data,
          backgroundColor:'rgba(61,230,196,0.7)'
        }],
        labels: call_types_label
      },
      options: {
        responsive: true,
        defaultFontSize: 18,
        legend:{
          display: false
        },
        title: {
          display: true,
          fontSize: 20,
          text: 'Types of Calls'
        },
        scales: {
          xAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Number of calls'
            }
          }],
          yAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Call Type'
            }
          }]
        }
      }
    })//close call_types

    //Create Call types without medical incidents chart
    var call_types2_label = [];
    var call_types2_data = [];
    for(var i in sorted_call_types) {
      if(sorted_call_types[i] != "Medical Incident"){
        call_types2_label.push(sorted_call_types[i]);
        call_types2_data.push(num_call_types[sorted_call_types[i]]);
      }
    }

    //event listener for switching charts
    $('#no_med').on('click', function(e) {
      if (medChart) {
        medChart = false;
        var data = call_types.config.data;
        data.datasets[0].data = call_types2_data;
        data.labels = call_types2_label;
        call_types.options.title.text = "Types of Calls (without Medical Incidents)"
        call_types.update();
      } else {
        medChart = true;
        var data = call_types.config.data;
        data.datasets[0].data = call_types_data;
        data.labels = call_types_label;
        call_types.options.title.text = "Types of Calls"
        call_types.update();
      }
    })

    //Create call type vs average time taken chart
    var calltype_label = [];
    var calltype_time_data = [];
    var calltype_time_sum = {};
    var calltype_time_count = {};
    var calltype_time_avg = {};

    //calculates count of each call_type and total time taken for each call type
    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      if (temp.difference >= 0) {
        calltype_time_sum[temp.call_type] = (calltype_time_sum[temp.call_type] || 0) + temp.difference;
        calltype_time_count[temp.call_type] = (calltype_time_count[temp.call_type] || 0) + 1;
      }
    }

    //calulates average
    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      calltype_time_avg[temp.call_type] = (calltype_time_sum[temp.call_type] / calltype_time_count[temp.call_type]).toFixed(2);
    }

    var sorted = Object.keys(calltype_time_avg).sort(function(a,b){return calltype_time_avg[b]-calltype_time_avg[a]})
    for(var i in sorted) {
      calltype_label.push(sorted[i]);
      calltype_time_data.push(calltype_time_avg[sorted[i]]);
    }

    //creates graph
    var call_type_vs_time = new Chart("call_type_time_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: calltype_time_data,
          backgroundColor:'rgba(128,230,61,0.7)'
        }],
        labels: calltype_label
      },
      options: {
        responsive: true,
        defaultFontSize: 18,
        title: {
          display: true,
          fontSize: 20,
          text: 'Average Time Taken per Call Type'
        },
        legend:{
          display: false
        },
        scales: {
          xAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Average time between call received and unit arrival (min)'
            }
          }],
          yAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Call Type'
            }
          }]
        }
      }
    })//close call type avg time chart

    var calltype_label_no_train = [];
    var calltype_time_data_no_train = [];

    for(var i in sorted) {
      if (sorted[i] != 'Train / Rail Incident'){
        calltype_label_no_train.push(sorted[i]);
        calltype_time_data_no_train.push(calltype_time_avg[sorted[i]]);
      }
    }

    //event listener for switching charts
    $('#no_rails').on('click', function(e) {
      if (railChart) {
        railChart = false;
        var data = call_type_vs_time.config.data;
        data.datasets[0].data = calltype_time_data_no_train;
        data.labels = calltype_label_no_train;
        call_type_vs_time.options.title.text = "Average Time Taken per Call Type (without Train/Rail Incidents)"
        call_type_vs_time.update();
      } else {
        railChart = true;
        var data = call_type_vs_time.config.data;
        data.datasets[0].data = calltype_time_data;
        data.labels = calltype_label;
        call_type_vs_time.options.title.text = "Average Time Taken per Call Type"
        call_type_vs_time.update();
      }
    })

    //Create neighborhood vs average time taken chart
    var neighborhood_label = [];
    var neighborhood_time_data = [];
    var neighborhood_count = {};
    var neighborhood_time_sum = {};
    var neighborhood_time_count = {};
    var neighborhood_time_avg = {};

    //gets count of each neighborhood and total time for each neighborhood
    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      if (temp.difference >= 0) {
        neighborhood_time_sum[temp.neighborhood_district] = (neighborhood_time_sum[temp.neighborhood_district] || 0) + temp.difference;
        neighborhood_time_count[temp.neighborhood_district] = (neighborhood_time_count[temp.neighborhood_district] || 0) + 1;
      }
      neighborhood_count[temp.neighborhood_district] = (neighborhood_count[temp.neighborhood_district] || 0) + 1;
    }

    //calculates average time taken
    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      neighborhood_time_avg[temp.neighborhood_district] = (neighborhood_time_sum[temp.neighborhood_district] / neighborhood_time_count[temp.neighborhood_district]).toFixed(2);
    }

    var neighborhood_sorted = Object.keys(neighborhood_time_avg).sort(function(a,b){return neighborhood_time_avg[b]-neighborhood_time_avg[a]})

    for(var i in neighborhood_sorted) {
      neighborhood_label.push(neighborhood_sorted[i]);
      neighborhood_time_data.push(neighborhood_time_avg[neighborhood_sorted[i]]);
    }

    //creates chart
    var neighborhood_average_time = new Chart("neighborhood_time_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: neighborhood_time_data,
          backgroundColor:'rgba(230,106,61,0.7)'
        }],
        labels: neighborhood_label
      },
      options: {
        responsive: true,
        defaultFontSize: 18,
        title: {
          display: true,
          fontSize: 20,
          text: 'Average Time Taken per Neighborhood'
        },
        legend:{
          display: false
        },
        scales: {
          xAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Average time between call received and unit arrival (min)'
            }
          }],
          yAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Neighborhood'
            }
          }]
        }
      }
    })//close neighborhood vs time taken chart

    //Create num calls vs neighborhood chart
    var neighborhood_sum_data = [];
    var neighborhood_sum_label = [];
    var sorted_neighborhood_sum = Object.keys(neighborhood_count).sort(function(a,b){return neighborhood_count[b]-neighborhood_count[a]})

    for(var i in sorted_neighborhood_sum) {
      neighborhood_sum_label.push(sorted_neighborhood_sum[i]);
      neighborhood_sum_data.push(neighborhood_count[sorted_neighborhood_sum[i]]);
    }

    var neighborhood_average_time = new Chart("neighborhood_num_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: neighborhood_sum_data,
          backgroundColor:'rgba(230,61,162,0.7)'
        }],
        labels: neighborhood_sum_label
      },
      options: {
        responsive: true,
        defaultFontSize: 18,
        title: {
          display: true,
          fontSize: 20,
          text: 'Number of Calls per Neighborhood'
        },
        legend:{
          display: false
        },
        scales: {
          xAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Number of Calls'
            }
          }],
          yAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Neighborhood'
            }
          }]
        }
      }
    })//close neighborhood vs num calls chart

    //Create safest neighborhood chart
    var safe_count = {};

    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      if(temp.call_type_group == "Non Life-threatening") {
        safe_count[temp.neighborhood_district] = (safe_count[temp.neighborhood_district] || 0) + 1;
      }
    }
    var safe_count_avg= {};
    for(var i in safe_count) {
      safe_count_avg[i] = Math.round((safe_count[i] / neighborhood_count[i]).toFixed(2) * 100);
    }

    var safe_sorted = Object.keys(safe_count_avg).sort(function(a,b){return safe_count_avg[b]-safe_count_avg[a]})
    var safe_count_data = [];
    var safe_count_label = [];
    for(var i in safe_sorted) {
      safe_count_label.push(safe_sorted[i]);
      safe_count_data.push(safe_count_avg[safe_sorted[i]]);
    }

    var safest_neighorhood_chart = new Chart("safest_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: safe_count_data,
          backgroundColor:'rgba(230,219,61,0.7)'
        }],
        labels: safe_count_label
      },
      options: {
        responsive: true,
        defaultFontSize: 18,
        title: {
          display: true,
          fontSize: 20,
          text: 'Percent of Non Life-Threatening Calls per Neighborhood'
        },
        legend:{
          display: false
        },
        scales: {
          xAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Percent of Calls (%)'
            }
          }],
          yAxes: [{
            gridLines:{
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: 'Neighborhood'
            }
          }]
        }
      }
    })//close neighborhood vs num calls

  })// close getJSON

});
