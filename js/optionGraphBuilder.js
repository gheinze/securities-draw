/* global d3 */

var a4 = a4 || {};

/**
 * Extend the "a4" library to provide option graphing functionality
 *
 */


// Bootstrap

$(document).ready(function () {
    //a4.init();
});



(function(exports) {

    "use strict";

    exports.generateOptionGraphSvg = generateOptionGraphSvg;
    exports.measures = measures(new Date());


    var svgExtents = defaultOptionSvgExtents();


    function measures(today) {
        return {

            askPrice: { label: 'Ask Price'
                       ,extractFrom: function(option) {return option.askPrice;}
                       ,scale: d3.scaleLinear()
                      }

           ,bidPrice: { label: 'Bid Price'
                       ,extractFrom: function(option) {return option.bidPrice;}
                       ,scale: d3.scaleLinear()
                      }

           ,bidRate:  { label: 'Bid Annualized Return'
                       ,extractFrom: function(option, lastPrice) {
                           var days = (option.expiryDate - today) / (1000 * 3600 * 24);
                           var fractionalYear = 365 / days;
                           var premium = option.strikePrice - lastPrice + option.bidPrice;
                           var rate = ((premium / lastPrice) * 100 * fractionalYear).toFixed(3);
                           return rate;
                       }
                       ,hasValue: function(option) { return option.bidPrice > 0; }
                       ,scale: d3.scaleLinear()
                      }

           ,strikePlusBid: { label: 'Strike Plus Bid'
                       ,extractFrom: function(option) {return option.bidPrice + option.strikePrice;}
                       ,scale: d3.scaleLinear()
                      }

           ,lastPrice: { label: 'Last Price'
                       ,extractFrom: function(option) {return option.lastPrice;}
                       ,scale: d3.scaleLinear()
                      }
        };
    }


    function generateOptionGraphSvg(container) {
        //d3.json("data/options_simplified.json", function(data){
        d3.json("data/options.json", function(data) {
            internalGenerateOptionGraphSvg(container, data);
        });
    };


    function internalGenerateOptionGraphSvg(container, data) {

        var parseOptionDate = d3.timeParse("%Y-%m-%d");

        var yMeasure = exports.measures.bidRate;

        var xScale = d3.scaleTime().range([0, svgExtents.dataArea.w]);
        var yScale = yMeasure.scale.range([svgExtents.dataArea.h, 0]);
        var zScale = d3.scaleOrdinal(d3.schemeCategory20);

        var line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return xScale(d.expiryDate); })
            .y(function(option) { return yScale(yMeasure.extractFrom(option, data.lastPrice)); })
        ;

        var svg = container
            .append("svg")
                .attr("width", svgExtents.full.w)
                .attr("height", svgExtents.full.h)
            .append("g")
                .attr("transform", "translate(" + svgExtents.margin.left + "," + svgExtents.margin.top + ")")
        ;


        var today = new Date();
        var calls = data.calls.filter(function(call) {
            return call.strikePrice > data.lastPrice * 0.8 && call.strikePrice < data.lastPrice * 1.2
                    && parseOptionDate(call.expiryDate) > today
                    && yMeasure.hasValue(call)
            ;
        });

        calls.forEach(function(d) {
            d.expiryDate = parseOptionDate(d.expiryDate);
        });

        xScale.domain(d3.extent(calls, function(d) { return d.expiryDate; }));
        yScale.domain([0, d3.max(calls, function(option) {return yMeasure.extractFrom(option, data.lastPrice);})]);
        zScale.domain(d3.map(function(d) { return d.displayStrikePrice; }));

        // callStrikePrices = Array.from(new Set(optionData.calls.map(function(x){return x.strikePrice;})));

        // "GROUP BY displayStrikePrice", the displayStrikePrice key is associated with an array of values for the key
        var callDataByStrikePrice = d3.nest()
            .key(function(d) { return d.displayStrikePrice; })
            .entries(calls)
        ;

        addXaxisLabeling(svg, xScale);
        addYaxisLabeling(svg, yScale, yMeasure.label);

        var strike = createStrikeGroupings(svg, callDataByStrikePrice);
        addDataPointsToStrikeLines(strike, line, zScale);
        addLabelsToStrikeLines(strike, xScale, yScale, yMeasure, data);

    }


    /* A fixed size for the svg element representing a option graph */
    function defaultOptionSvgExtents() {
        var full = {w: 1200, h: 800};
        var margin = {top: 20, right: 80, bottom: 30, left: 50};
        var dataArea = {
            x: margin.left,
            y: margin.bottom,
            w: full.w - margin.left - margin.right,
            h: full.h - margin.top - margin.bottom
        };
        return {full: full, margin: margin, dataArea: dataArea};
    }


    function addXaxisLabeling(svg, xScale) {
            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + svgExtents.dataArea.h + ")")
                .call(d3.axisBottom(xScale))
            ;
    }


    function addYaxisLabeling(svg, yScale, label) {
             svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(yScale))
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "0.71em")
                .attr("fill", "#000")
                .text(label)
            ;
    }


    function createStrikeGroupings(svg, callDataByStrikePrice) {
        return svg.selectAll(".strike")
                 .data(callDataByStrikePrice)
                 .enter().append("g")
                   .attr("class", "strike");

    }


    function addDataPointsToStrikeLines(strike, line, zScale) {
        strike.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); }) // array of objects with  expiryDate and askPrice values for this strike price
            .style("stroke", function(d) { return zScale(d.key); });
    }


    function addLabelsToStrikeLines(strike, xScale, yScale, yMeasure, data) {
        strike.append("text")
            .datum(function(d) { return {id: d.key, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + xScale(d.value.expiryDate) + "," + yScale(yMeasure.extractFrom(d.value, data.lastPrice)) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .text(function(d) { return d.id; });
    }


})(a4);
