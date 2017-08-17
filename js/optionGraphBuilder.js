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


    function measures(today) {
        return {
            askPrice: { label: 'Ask Price'
                       ,extractFrom: function(option) {return option.askPrice;}
                       ,scale: d3.scaleLinear()
                      }
           ,askRate:  { label: 'Ask % Return'
                       ,extractFrom: function(option) {
                           var fractionalYear = 365 / (today - option.expiryDate) / (1000 * 3600 * 24);
                           return option.askPrice;
                       }
                       ,scale: d3.scaleLinear()
                      }
           ,bidPrice: { label: 'Bid Price'
                       ,extractFrom: function(option) {return option.bidPrice;}
                       ,scale: d3.scaleLinear()
                      }
           ,lastPrice: { label: 'Last Price'
                       ,extractFrom: function(option) {return option.lastPrice;}
                       ,scale: d3.scaleLinear()
                      }
        };
    }


    function generateOptionGraphSvg(container) {

        var svgExtents = defaultOptionSvgExtents();
        var parseOptionDate = d3.timeParse("%Y-%m-%d");

        var yMeasure = exports.measures.askRate;

        var x = d3.scaleTime().range([0, svgExtents.dataArea.w]);
        var yScale = yMeasure.scale.range([svgExtents.dataArea.h, 0]);
        var z = d3.scaleOrdinal(d3.schemeCategory20);

        var line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return x(d.expiryDate); })
            .y(function(option) { return yScale(yMeasure.extractFrom(option)); })
        ;

        var svg = container
            .append("svg")
                .attr("width", svgExtents.full.w)
                .attr("height", svgExtents.full.h)
            .append("g")
                .attr("transform", "translate(" + svgExtents.margin.left + "," + svgExtents.margin.top + ")")
        ;


        //d3.json("data/options_simplified.json", function(data){
        d3.json("data/options.json", function(data){

            function initChart(){
            };
            // initChart();

            var calls = data.calls.filter(function(call) {
                return call.strikePrice > data.lastPrice * 0.8 && call.strikePrice < data.lastPrice * 1.2;
            });

            calls.forEach(function(d) {
                d.expiryDate = parseOptionDate(d.expiryDate);
            });

            x.domain(d3.extent(calls, function(d) { return d.expiryDate; }));
            yScale.domain([0, d3.max(calls, function(option) {return yMeasure.extractFrom(option);})]);
            z.domain(d3.map(function(d) { return d.displayStrikePrice; }));

            // callStrikePrices = Array.from(new Set(optionData.calls.map(function(x){return x.strikePrice;})));

            var callDataByStrikePrice = d3.nest()
                .key(function(d) { return d.displayStrikePrice; })
                .entries(calls)
            ;

            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + svgExtents.dataArea.h + ")")
                .call(d3.axisBottom(x))
            ;

            svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(yScale))
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "0.71em")
                .attr("fill", "#000")
                .text(yMeasure.label)
            ;

            var strike = svg.selectAll(".strike")
                .data(callDataByStrikePrice)
                .enter().append("g")
                  .attr("class", "strike");

            strike.append("path")
                .attr("class", "line")
                .attr("d", function(d) { return line(d.values); }) // array of objects with  expiryDate and askPrice values for this strike price
                .style("stroke", function(d) { return z(d.key); });

            strike.append("text")
                .datum(function(d) { return {id: d.key, value: d.values[d.values.length - 1]}; })
                .attr("transform", function(d) { return "translate(" + x(d.value.expiryDate) + "," + yScale(yMeasure.extractFrom(d.value)) + ")"; })
                .attr("x", 3)
                .attr("dy", "0.35em")
                .style("font", "10px sans-serif")
                .text(function(d) { return d.id; });

        });

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

}





})(a4);
