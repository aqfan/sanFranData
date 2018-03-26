# sanFranData

An analysis of data from the San Francisco Fire Department of emergency calls.

Built for the CapitalOne Challenge for Summer Summit 2018.

Challenge:  https://www.mindsumo.com/contests/sfpd-dispatch

## Table of Contents
1. [How to Run](#run)
2. [Challenge Features](#features)
3. [Bonus Features](#bonus)
4. [Libraries Used](#resources)


## How to Run <a name="run"></a>

You can view my project at: https://san-francisco-call-data.herokuapp.com/

Or you can clone my project and run

```
npm install
node server.js
```

## Challenge Features <a name="features"></a>

Data Visuals: Display or graph 3 metrics or trends from the data set that are interesting to you.
* Types of Calls vs Number of Calls
    * Shows that Medical Incidents account for more than double the other types of calls
    * Can switch the graph to a graph that doesn't show Medical Incidents by clicking on the red "here"
* Average Dispatch Time vs Call Type
    * Shows that train/rail incidents take the longest time to dispatch
    * Can switch to a graph that doesn't show train/rail incidents by clicking on the red "here
* Number of Calls per Neighborhood
    * Shows that Financial District South has the most amount of calls and Sunset has smallest number of calls

Which areas take the longest time to dispatch to on average? How can this be reduced?
* Dispatch time per neighborhood graph shows that the Financial District South has the longest average dispatch time of 26.44 minutes while all of the other neighborhoods have an average time of less than 10 minutes. So how can we fix this? One way to decrease dispatch time is by having more emergency units available. Notice that Financial District South also has the highest amount of emergency calls, which seems to show that there are not enough units to cover all of the calls. So, if we increase the number of units, then more units will be free so a dispatcher can quickly connect to and dispatch a unit. Another solution would be to increase efficiency of units. This may include figuring out exactly what the problem is in order to dispatch the proper unit or to create a better system for units to solve problems faster.​

Given an address and time, what is the most likely dispatch to be required?
* Estimates type of call made, type of unit dispatched, and time taken for dispatch based on inputted address and time.
* Estimates are made by looking for datasets within 0.01 degrees of the given address and withing 30 minutes of the given time

## Bonus Features <a name="bonus"></a>

Heat maps: Add heat maps that show dispatch frequency, urgency over the city.
* Heat map allows user to toggle between frequency and urgency.
* Frequency calculated by placing a data point for each location coordinate
* Urgency calculated by placing a weight on each location coordinate. If the final_priority is 2 (non-emergency), then the location gets a weight of 1. If the final_priority is 3 (emergency), then the weight is 30.

Crime correlation: Based on the type of dispatch and the frequency of dispatch, show the most calm and safe neighborhoods in the city
* The percent of non life-threatening calls per neighborhood graph shows the neighborhoods in order of safest to most dangerous.
* Financial District South has the highest percentage of non life-threatening calls and is the safest neighborhood

## Libraries Used <a name="resources"></a>

* [Bootstrap 4](https://startbootstrap.com/) for beautifying the site
* [PapaParse 4.3](https://www.papaparse.com/) for CSV parsing
* [Chart.js 2.0](http://www.chartjs.org/) for creating graphs
* [Google Maps API](https://developers.google.com/maps/documentation/javascript/) for heat map
