/* Variables 
/* ******/
var dayAvg = 14,
    dateStr = "26/11/2014",
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

var margin = {top: 15, right:15, bottom: 35, left: 15},
    width = w - margin.left - margin.right,
    height = h*2/3,// - margin.bottom,
    viewBox = "0 0 " + w + " " + h,
    coord = {x: 0, y: 50};
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

//x.domain([parseDate(dateStr), parseDate(dateEnd)]);
//y.domain([coord.x, coord.y]);

// Add the svg
var chart = d3.select("svg")
            //.attr("width", width + margin.left + margin.right)
            //.attr("height", height + margin.bottom)
            //.attr("viewBox", viewBox)
            //.attr("preserveAspectRatio", "xMinYMin meet"),
    svg = chart.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define the axes
var xAxis = d3.svg.axis().scale(x).orient("bottom")
              .ticks(d3.time.month).tickFormat(d3.time.format("%b")),
    yAxis = d3.svg.axis().scale(y).orient("right")
              .ticks(5).tickSize(width);

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

responsiveUpdate();
d3.select(window).on('resize', responsiveUpdate); 
/* ************/


/* D3: Drawing
/* ******/

function drawText(svgObj, key, className) {
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

function drawPolygon(svgObj, className) {
  var svg = svgObj.append("polygon")
        .attr("class", className)
        .attr("points", function(d) { 
          var points,
              yMax, yMin, ptMax, ptMin;
          
          // area for avg line and all vi dots
          ptMax = d.values.map(function(d) { 
            yMax = (d.viMax > d.vi) ? y(d.viMax) : y(d.vi) - 10;
            return [x(d.date), yMax].join(","); 
          }).join(" ");
          ptMin = d.values.map(function(d) { 
            yMin = (d.viMin < d.vi) ? y(d.viMin) : y(d.vi) + 10;
            return [x(d.date), yMin].join(","); 
          }).reverse().join(" ");
          /*
          // area for avg line
          ptMax = d.values.map(function(d) { return [x(d.date), y(d.vi) - 5].join(","); }).join(" ");
          ptMin = d.values.map(function(d) { return [x(d.date), y(d.vi) + 5].join(","); }).reverse().join(" ");
          */
          //TODO: area for detection
          // ...

          points = [ptMax, ptMin];
          return points;
        });
  return svg;
}

// Draw average lines for each party
function drawLine(svgObj, x1, y1, x2, y2, className) {
  svgObj.append("line")
        .attr("class", className)
        .attr("x1", x1) 
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2);
}

function drawPathWithLines(svgObj, className){
  svgObj.append("path")
        .attr("class", className) 
        .attr("d", function(d) { return line(d.values); })
}

function drawCircle(svgObj, cx, cy, r, className) {
  svgObj.append("circle")
        .attr("class", className)
        .attr("cx", cx) 
        .attr("cy", cy)
        .attr("r", r);
}

function drawCircles(svgObj, r, className) {
  var svg;
  svg = svgObj.selectAll("circle")
        .data(function(d) { return d.values; }).enter()
        .append("circle")
        .attr("class", className)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.vi); })
        .attr("r", r);
  return svg;
}

function drawForeignObject (svgObj, w, h, x, y, className, data) {
  var date = new Date(data.date),
      dateText = monthNameFormat(date) + " " + date.getDate() + " " + date.getFullYear();
              
  svgObj.append("foreignObject")
        .attr("class", className)
        .attr("width", w)
        .attr("height", h)
        .attr("x", x)
        .attr("y", y)
        .append("xhtml:body")
        .html(
          '<div class="tp-text">' + 
          '<div class="tp-text-misc"><b>' + termList[data.pollster] + " Poll</b></br>" + dateText + '</div>' +
          '<div class="tp-text-vi ' + data.party + '">' + termList[data.party] + ": " + data.vi + "</div>" + 
          "</div>"
        );
} 

function drawCoordinate() {
  var svgYAxis;
  //Add the X Axis  
  svg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + height + ")")
     .call(xAxis);
  //Add the Y Axis
  svgYAxis = svg.append("g")
     .attr("class", "y axis")
     .call(yAxis);
  svgYAxis.selectAll("g")
     .filter(function(d) { return d; })
     .classed("sc-ddd", true);
  svgYAxis.selectAll("text")
     .attr("x", 0)
     .attr("dy", -3);
}

function onCircles(svgObj) {
  svgObj.on("mouseover", function(d) {
          // 1. Add tooltip
          var xPos = parseFloat(d3.select(this).attr("cx")),
              yPos = parseFloat(d3.select(this).attr("cy")),
              xPosEnd = x(parseDate(dateEnd)),
              xPosShift = xPos,
              yPosShift = yPos,
              xShift = 65;

          if (xPos < xShift) { xPosShift = xShift; }
          else if (xPos > (xPosEnd - xShift + margin.right)) { xPosShift = xPosEnd - xShift + margin.right; }
          
          if (yPos > (y(coord.y) - 120)) { yPosShift = y(coord.y) - 120; }
          
          //TODO: use <div> instead of foreign obj, perhaps!?
          drawLine(svg, xPos, yPos - 8, xPosShift, yPos - 45, "tp-line");
          drawCircle(svg, xPos, yPos, 9, "tp-circle");
          drawForeignObject (svg, 160, 80, xPosShift - xShift, yPos - 120, "tp", d);
          
          // 2. highlight avg path
          this.parentNode.classList.add("op-1-pathpolls");
          d3.select("." + d.party).classed("op-1-path", true);
        })
        .on("mouseout", function(d) {
          // 1. Remove tooltip
          svg.select(".tp").remove();
          svg.select(".tp-line").remove();
          svg.select(".tp-circle").remove();
          
          // 2. Remove highlight
          this.parentNode.classList.remove("op-1-pathpolls");
          d3.select("." + d.party).classed("op-1-path", false);
        });
}

function onPolygon(svgObj) {
  var ele;
  svgObj.on("mouseover", function(d) { 
          ele = document.querySelector(".party-polls." + d.party)
          ele.classList.add("op-1-polls");
          this.parentNode.classList.add("op-1-path"); 
        })
        .on("mouseout",  function(d) { 
          ele.classList.remove("op-1-polls");
          this.parentNode.classList.remove("op-1-path"); 
        });
}
/* ************/


/* D3: Data and Drawing
/* ******/
d3.json("data.json", function(error, rawData) {
  
  var data, dataset,
      svgParty, svgPollster, 
      svgRange, svgVi;

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
  console.log(dataset);


  /* Drawing */
  // Draw coordinate
  drawCoordinate();
  
  svgParty = svg.selectAll("party")
                .data(dataset.date)
                .enter().append("g")            
                .attr("class", function(d) { return "party " + d.party; });
  
  svgPolls = svg.selectAll("party-polls")
                .data(dataset.pollster)
                .enter().append("g")
                .attr("class", function(d) { return "party-polls " + d.party; })
                .selectAll("g")
                .data(function(d) { return d.pollster; })
                .enter().append("g")
                .attr("class", function(d, index) { return "pollster p" + index;} );

  // 1. Draw area, path (with lines) - avarage, text
  drawPathWithLines(svgParty, "path-average")
  drawText(svgParty, "party", "text-party");
  
  svgRange = drawPolygon(svgParty, "polygon-range");
  onPolygon(svgRange); 

  // 2. Draw path (with lines) - individuals, text
  drawPathWithLines(svgPolls, "path-polls");
  //drawText(svgPollster, "pollster");
  
  // 3. Draw circle - vi
  svgVi = drawCircles(svgPolls, 3, "circle-vi");
  onCircles(svgVi);
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
  dataByPartyPollster = dataByParty.map(function(d) {
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
  };});

  // data grouped by date and pollster  
  dataByPartyDate = dataByParty.map(function(d) {
    var datum = d.values;
    
    return {
      party: d.party,
      
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
  
  return { 
    date: dataByPartyDate,
    pollster: dataByPartyPollster
  }
}
/* ************/
