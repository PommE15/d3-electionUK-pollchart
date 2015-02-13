/* Variables 
/* ******/
var dayAvg = 14,
    dateStr = "01/12/2014",
    dateEnd = "07/05/2015",
    partyList = ["CON", "LAB", "LD", "UKIP", "GRN"/*, "others"*/], //TODO: match with the raw data
    pGroup1 = ["Lord Ashcroft", "Opinium", "Populus", "YouGov"],
    pGroup2 = ["ComRes", "ComResO", "ICM", "Ipsos", "TNS", "Survation"]
    termList = { CON: "Con", LAB: "Lab", UKIP: "UKIP", LD: "LD", GRN: "Green",
                 YouGov: "YouGov", Populus: "Populus", "Lord Ashcroft": "Ashcroft", Opinium: "Opinium",
                 ComRes: "ComRes", ComResO: "ComRes Online", TNS: "TNS BMRB", ICM: "ICM",
                 Ipsos: "Ipsos-MORI", Survation: "Survation" };

// Dimensions of the chart
var w = window,
    d = document,
    e = d.documentElement,
    w = w.innerWidth || e.clientWidth, //|| g.clientWidth,
    h = w.innerHeight|| e.clientHeight;//|| g.clientHeight;

var margin = {top: 10, right:25, bottom: 35, left: 25},
    width = w - margin.left - margin.right,
    height = h*2/3,// - margin.bottom,
    viewBox = "0 0 " + w + " " + h,
    coord = {x: 0, y:55};
/* ************/


/* D3: Utilities & Settings 
/* ******/
// Date / time format
var dateFormat = "%d/%m/%Y",
    monthNameFormat = d3.time.format("%b");
// Parse the date / time
var parseDate = d3.time.format(dateFormat).parse;

// Ranges of the charts
var x = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]);

/*x.domain([parseDate(dateStr), parseDate(dateEnd)]);
y.domain([coord.x, coord.y]);*/

// Add the svg
var chart = d3.select("#chart")
            .append("svg")
            //.attr("width", width + margin.left + margin.right)
            //.attr("height", height + margin.bottom)
            //.attr("viewBox", viewBox)
            //.attr("preserveAspectRatio", "xMinYMin meet"),
    svg = chart.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define the axes
var xAxis = d3.svg.axis().scale(x).orient("bottom")
              .ticks(d3.time.month).tickFormat(d3.time.format("%b")),
    yAxis = d3.svg.axis().scale(y).orient("left")
              .ticks(5);//.tickFormat(d3.format(".0%"));

// Define the line
var line = d3.svg.line()
             //.interpolate("basis")
             .x(function(d) { return x(d.date); })
             .y(function(d) { return y(d.vi); });

// Window resize 
function responsiveUpdate(){
  //width  = parseInt(d3.select("#chart").style("width")),// - margin.left - margin.right,
  //height = parseInt(d3.select("#chart").style("height"));//margin.bottom;
  
  // response
  if ((width < 400 && height < 640) || (width < 640 && height < 400)) {
    var today = new Date,
        month = today.getMonth() + 1;

    dateEnd = today.getDate() + "/" + month + "/" + today.getFullYear();
  }
  
  // Scale the range of the data
  x.domain([parseDate(dateStr), parseDate(dateEnd)]);
  y.domain([coord.x, coord.y]); 

  chart.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.bottom);
}       
//window.onresize = updateWindow;           
responsiveUpdate();
d3.select(window).on('resize', responsiveUpdate); 
/* ************/


/* D3: Drawing
/* ******/

function drawText(svgObj, key) {
  svgObj.append("text")
        //.datum(function(d) { return {key: d[key], value: d.values[0]}; }) //DEBUG: order
        .datum(function(d) { return {key: d[key], value: d.values[d.values.length - 1], party: d.party}; }) //DEBUG: order
        .attr("class", "text")
        .attr("text-anchor", "middle")
        .attr("x", function(d){ return x(d.value.date); })
        .attr("y", function(d){ 
          //TODO: rewrite with auto calc
          var yPos, v = d.value, vi;
          if ((d.party === "CON") || (d.party === "GRN")) {
            // below the avg line
            vi = (v.vi > v.viMin) ? v.viMin : v.vi;
            yPos = y(vi) + 20;
          } else {
            // above the avg line
            vi = (v.vi < v.viMax) ? v.viMax : v.vi;
            yPos = y(vi) - 10;
          }
          return yPos; 
        })
        .text(function(d) { return termList[d.key]; });
}

function drawArea(svgObj) {
  svgObj.append("polygon")
        .attr("class", "range")
        .attr("points", function(d) { 
          var ptMax, ptMin;
          ptMax = d.values.map(function(d) { return [x(d.date), y(d.viMax)].join(","); }).join(" ");
          ptMin = d.values.map(function(d) { return [x(d.date), y(d.viMin)].join(","); }).reverse().join(" ");
          return [ptMax, ptMin];
        });
}

// Draw average lines for each party
function drawLineAverage(svgObj) {  
  svgObj.append("path")
        .attr("class", "average")
        .attr("d", function(d) { return line(d.values); })
        // highlight when hover
        .on("mouseover", function(d) { this.parentNode.classList.add("op-1"); })
        .on("mouseout",  function(d) { this.parentNode.classList.remove("op-1"); });
}

// Draw individual lines from pollsters
function drawLineIndividuals(svgObj) {
  svgObj.append("path")
        .attr("d", function(d) { return line(d.values); })
        //TODO: change to svg tooltip
        .append("title")
        .text(function(d) { return d.pollster; });
}

function drawCircles(svgObj) {
  svgObj.selectAll("circle")
        .data(function(d) { return d.values; })
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.date)})
        .attr("cy", function(d) { return y(d.vi); })
        .attr("r", 3)
        .on("mouseover", function(d) {
          var date = new Date(d.date),
              dateText = monthNameFormat(date) + " " + date.getDate() + " " + date.getFullYear(),
              xPos = parseFloat(d3.select(this).attr("cx")) - 65,
              yPos = parseFloat(d3.select(this).attr("cy")) - 100,
              xPosEnd = x(parseDate(dateEnd));/*,
              xPosR = parseFloat(d3.select(this).attr("cx")) + 20,
              yPosR = parseFloat(d3.select(this).attr("cy")) - 35,
              xPosT = xPosR + 9,
              yPosT = yPosR + 3,
              tp;*/ 

          xPos = (xPos < 0) ? 0 : xPos;
          xPos = (xPos > (xPosEnd - 100)) ? (xPosEnd - 100 - margin.right) : xPos;
          
          // Add line to tooltip
          svg.append("line")
             .attr("id", "tooltip-line")
             .attr("class", "tooltip-line")
             .attr("x1", xPos + 65) 
             .attr("y1", yPos + 95)
             .attr("x2", xPos + 65)
             .attr("y2", yPos + 100 - 25);
          /*/ Add tooltip label with svg
          svg.append("rect")
             .attr("id", "tp-rect")
             .attr("x", xPosR).attr("y", yPosR)
             .attr("width", "7em").attr("height", "4.5em")
             .attr("fill", "#eee")
             .attr("opacity", "0.9");
          tp = svg.append("text")
                  .attr("id", "tp-text")
                  //.attr("x", xPosT)
                  .attr("y", yPosT)
                  .attr("text-anchor", "left")
                  .attr("fill", "black");
          console.log(d.pollster, termList[d.pollster]);
          tp.append("tspan").attr("x", xPosT).attr("dy", "1.2em").text(termList[d.pollster]);
          tp.append("tspan").attr("x", xPosT).attr("dy", "1.2em").text(dateText);
          tp.append("tspan").attr("x", xPosT).attr("dy", "1.2em").text(termList[d.party] + ": " + d.vi);*/
          
          // Add tooltip label with foreign Object
          svg.append("foreignObject")
             .attr("id", "tooltip")
             .attr("width", 130)
             .attr("height", 80)
             .attr("x", xPos)
             .attr("y", yPos)
             .append("xhtml:body")
             .html(
               '<div class="tooltip">' + 
               '<div class="txt-vi ' + d.party + '">' + termList[d.party] + ": " + d.vi + "</div>" + 
               '<div class="txt-box">' + 
               termList[d.pollster] + "</br>" +
               dateText + 
               '</div>' +
               "</div>"
             );
        })
        .on("mouseout", function(d) {
          //svg.select("#tp-rect").remove();
          //svg.select("#tp-text").remove();
          svg.select("#tooltip").remove();
          svg.select("#tooltip-line").remove();
        });
}

function drawLineVertical(svgObj) {
  svgObj.append("rect")
        .attr("x", function(d) { return x(d.date); })
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", height)
        .attr("class", "ruler");
}

function drawCoordinate() {
  //Add the X Axis  
  svg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + height + ")")
     .call(xAxis);

  //Add the Y Axis
  svg.append("g")
     .attr("class", "y axis")
     .call(yAxis);
}
/* ************/


/* D3: Data and Drawing
/* ******/
d3.json("data.json", function(error, rawData) {
  
  var data, dataset,
      svgParty, svgPollster;

  // Make sure data is loaded correctly
  if (error) { console.error("Try refreshing your browser."); return; } 
  else { console.info("Data is good to go!"); }


  /* Data */ 
  // Parse date
  data = rawData.map(function(d) {
    d.date = +parseDate(d.date); 
    // + convert a Date object to time in milliseconds
    return d;  
  });
  // Compose data 
  dataset = composeDataByParty(data);
  //console.log(dataset);


  /* Drawing */
  svgParty = svg.selectAll("g")
                .data(dataset)
                .enter().append("g")            
                .attr("class", function(d) { return "party " + d.party; });

  // 1. Draw area, path (with lines) - avarage, text
  //drawArea(svgParty);
  drawLineAverage(svgParty);
  drawText(svgParty, "party");
  
  svgPollster = svgParty.selectAll("g")
                        .data(function(d) { return d.pollster; })
                        .enter()
                        .append("g")
                        .attr("class", function(d, index) { return "pollster p" + index;} );
  
  // 2. Draw path (with lines) - individuals, text
  //drawLineIndividuals(svgPollster);
  //drawText(svgPollster, "pollster");
  
  // 3. Draw circle, rect
  drawCircles(svgPollster);
  //drawLineVertical(svgCircles);
  
  // Draw coordinate
  drawCoordinate();
  
});
/* ************/


/* Data: Utility functions
/* ******/
function averageArray(array) {
  var sum = array.reduce(function(preVal, curVal) {
    return preVal + curVal;
  });
  return sum / array.length;
}

function extractDataByKey(data, key) {
  return data.map(function(d) {
    return d[key];
  }).sort().filter(function(d, index, array) {
    //unique
    return d !== array[index - 1];
  });     
}

function composeDataByParty(data) {
  var dateList = extractDataByKey(data, "date"),
      pollsterList = extractDataByKey(data, "pollster"),
      dataByParty,
      dataByPartyDatePollster;

  // data grouped by party  
  dataByParty = partyList.map(function(party) {
    return {
      party: party,
      values: data.map(function(d) {
        return {
          date: d.date,
          pollster: d.pollster,
          vi: d[party]
      }})//end of data.map (values)
  };});//end of partyList.map

  // data grouped by date and pollster  
  dataByPartyDatePollster = dataByParty.map(function(d) {
    var datum = d.values;
    
    return {
      party: d.party,
      
      pollster: pollsterList.map(function(pollster) {
        return {
          pollster: pollster,
          values: datum.filter(function(p) {
            return p.pollster === pollster;
          }).map(function(p) {
            return {
              party: d.party,
              pollster: p.pollster,
              date: p.date,
              vi: p.vi
          };
        }) //end of datum.filter (values)
      };}), //end of pollster.map
      
      values: dateList.map(function(date) {
        var viDayList, 
            viAvgList = []; 
        
        viDayList = datum.filter(function(d) { 
          return d.date === date; 
        }).map(function(d) { 
          return d.vi; 
        });

        function findViListByGroup(group, p) {
          return datum.filter(function(d) {
            switch (group) {
              case 1: return (d.pollster === p) && (d.date <= date) && (d.date > (date - 86400000*dayAvg)); break;
              case 2: return (d.pollster === p) && (d.date <= date); break;
              default: console.err("wrong group!");
            }
          }).map(function(d) {
            return d.vi;
          });
        }
        
        temp = new Date(date);
        //if (date === 1423440000000) { console.log(temp.getDate() + "." + temp.getMonth()); }
        // Take the vi from the past 14 days and average it (if any)
        pGroup1.forEach(function(d) {
          var li = findViListByGroup(1, d);
          //if (date === 1423440000000) { console.log(li, averageArray(li), d); }
          if (li.length !== 0) {
            viAvgList.push(averageArray(li));
        }});
        //if (date === 1423440000000) { console.log("---");}  
        // Take the nearest vi from the past (if any)
        pGroup2.forEach(function(d) {
          var li = findViListByGroup(2, d),
              len = li.length;
        //if (date === 1423440000000) { console.log(li, li[len-1], d);}  
        if (len !== 0) {
            viAvgList.push(li[len-1]);
        }});
        //console.log("[" + date.getDate() + "." + date.getMonth() + "]", viAvgList.join(", "));:   
        //if (date === 1423440000000) { console.log("avg =>", averageArray(viAvgList)); }
        return {
          date: date,
          vi: averageArray(viAvgList),
          //viAvgList: viAvgList,
          //viDayList: viDayList,
          viMin: d3.min(viDayList), 
          viMax: d3.max(viDayList) 
        };
      }) //end of dateList.map (values)  
  };}); //end of dataByParty.map
  
  return dataByPartyDatePollster;
 }
/* ************/
