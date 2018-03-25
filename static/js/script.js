"use strict";

var map, heatmap, marker;

var medChart, railChart = true;

function initMap() {
  map = new google.maps.Map(document.getElementById('heatmap'), {
    zoom: 13,
    center: {lat: 37.7749, lng: -122.4194},
    mapTypeId: 'roadmap',
    gestureHandling: 'cooperative'
  });

  var marker = new google.maps.Marker({
    position: {lat: 37.7749, lng: -122.4194},
    map: map,
    draggable: true
  });

}

// Gets heatmap data from csv
function getPoints(data) {
  var arr = new google.maps.MVCArray();
  for (var i = 0; i < 10000; i++) {
    var coordinate = data[i];
    var lat = parseFloat(coordinate.latitude);
    var lgn = parseFloat(coordinate.longitude);
    arr.push(new google.maps.LatLng(lat, lgn));
  }
  return arr;
}

$(document).ready(() => {
  //Creates HeatMap
  $.getJSON('/data').done(function(data) {
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: getPoints(data),
      map: map
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
          backgroundColor:'rgba(190,69,25,0.7)'
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

    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      calltype_time_sum[temp.call_type] = (calltype_time_sum[temp.call_type] || 0) + temp.difference;
      calltype_time_count[temp.call_type] = (calltype_time_count[temp.call_type] || 0) + 1;
    }

    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      calltype_time_avg[temp.call_type] = (calltype_time_sum[temp.call_type] / calltype_time_count[temp.call_type]).toFixed(2);
    }

    var sorted = Object.keys(calltype_time_avg).sort(function(a,b){return calltype_time_avg[b]-calltype_time_avg[a]})
    for(var i in sorted) {
      calltype_label.push(sorted[i]);
      calltype_time_data.push(calltype_time_avg[sorted[i]]);
    }

    var call_type_vs_time = new Chart("call_type_time_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: calltype_time_data,
          backgroundColor:'rgba(95,89,12,0.7)'
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
              labelString: 'Average time between call received and unit dispatched (min)'
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
    })//close call type

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
    var neighborhood_time_sum = {};
    var neighborhood_time_count = {};
    var neighborhood_time_avg = {};

    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      neighborhood_time_sum[temp.neighborhood_district] = (neighborhood_time_sum[temp.neighborhood_district] || 0) + temp.difference;
      neighborhood_time_count[temp.neighborhood_district] = (neighborhood_time_count[temp.neighborhood_district] || 0) + 1;
    }

    for(var i = 0; i < data.length; i++) {
      var temp = data[i];
      neighborhood_time_avg[temp.neighborhood_district] = (neighborhood_time_sum[temp.neighborhood_district] / neighborhood_time_count[temp.neighborhood_district]).toFixed(2);
    }

    var neighborhood_sorted = Object.keys(neighborhood_time_avg).sort(function(a,b){return neighborhood_time_avg[b]-neighborhood_time_avg[a]})

    for(var i in neighborhood_sorted) {
      neighborhood_label.push(neighborhood_sorted[i]);
      neighborhood_time_data.push(neighborhood_time_avg[neighborhood_sorted[i]]);
    }

    var neighborhood_average_time = new Chart("neighborhood_time_chart", {
      type: 'horizontalBar',
      data: {
        datasets: [{
          data: neighborhood_time_data,
          backgroundColor:'rgba(230,61,162,0.7)'
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
              labelString: 'Average time between call received and unit dispatched (min)'
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
    })//close neighborhood vs time taken

  })// close getJSON

});

//Creates unit_type vs time taken graph
