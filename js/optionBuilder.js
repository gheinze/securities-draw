/* global d3 */

var a4 = a4 || {};

/**
 * This file builds the library "a4" which exposes:
 *   o optionType:  an enum to specify the option as either CALL or PUT
 *   o Option:      a class to contain the attributes specifying an option
 *   o generateOptionStateSvg: a function for generating an SVG object to represent the option
 *
 */


// Bootstrap

$(document).ready(function () {
    a4.init();
});



(function(exports) {

    "use strict";

    /* Sizing attributes specifying the generated svg element */
    var optionSvgExtents = defaultOptionSvgExtents();


    exports.optionType = optionType();
    exports.Option = Option;
    exports.generateOptionStateSvg = generateOptionStateSvg;
    exports.init = init;



    function optionType() {
        return { CALL: 'CALL', PUT: 'PUT' };
    }


    function Option(type, underlyingCommodityPriceAtPurchase, strikePrice, premium) {

        this.optionType =
                type === exports.optionType.CALL ?
                         exports.optionType.CALL :
                         exports.optionType.PUT
                 ;

        this.underlyingCommodityPriceAtPurchase = underlyingCommodityPriceAtPurchase;
        this.strikePrice = strikePrice;
        this.premium = premium;
    }


    function init() {
    }




    /* A fixed size for the svg element representing a CALL or PUT option */
    function defaultOptionSvgExtents() {
        var full = {w: 100, h: 25};
        var margin = {top: 0, right: 0, bottom: 0, left: 0};
        var dataArea = {
            x: margin.left,
            y: margin.bottom,
            w: full.w - margin.left - margin.right,
            h: full.h - margin.top - margin.bottom
        };
        return {full: full, margin: margin, dataArea: dataArea};
    }



    /**
     * Add an svg element to a container representing a "spark" diagram of the
     * current state wrt strike price of a CALL or PUT option. The state is
     * represented by a price line:
     *   - solid line indicates ownership of the underlying commodity on expiry
     *   - dashed line indicates non-ownership of the underlying commodity on expiry
     *   - black dot was the price of the underlying commodity at time of option purchase
     *   - green triagle represents current price of underlying commodity
     *
     * @param {Element} container The container into which the svg element will be placed.
     * @param {Option} option The Option object to plot.
     * @param {number} currentPrice The current price of the underlying commodity of the Option.
     * @param {start: number, end: number} plotRange The price range of the underlying commodity that should
     * be inclued in the graph, specified by "start" and "end" attributes.
     * @returns {undefined}
     */
    function generateOptionStateSvg(container, option, currentPrice, plotRange) {

        var xScale = d3.scaleLinear()
                .domain([plotRange.start, plotRange.end])
                .rangeRound([
                    optionSvgExtents.dataArea.x,
                    optionSvgExtents.dataArea.x + optionSvgExtents.dataArea.w
                ])
                ;

        var svg = container
                .append("svg")
                .attr("width", optionSvgExtents.full.w)
                .attr("height", optionSvgExtents.full.h)
                ;

        var midHeight = optionSvgExtents.dataArea.y + optionSvgExtents.dataArea.h / 2;

        var lineUpToStrikePrice = svg.append("line")
                .attr("x1", function(d) { return xScale(plotRange.start); })
                .attr("y1", midHeight)
                .attr("x2", function(d) { return xScale(option.strikePrice); })
                .attr("y2", midHeight)
                .attr("stroke-width", 1)
                .attr("stroke", "black")

        ;

        var lineAfterStrikePrice = svg.append("line")
                .attr("x1", function(d) { return xScale(option.strikePrice); })
                .attr("y1", midHeight)
                .attr("x2", function(d) { return xScale(plotRange.end); })
                .attr("y2", midHeight)
                .attr("stroke-width", 1)
                .attr("stroke", "black")
        ;


        if (option.optionType === 'CALL') {
            lineAfterStrikePrice.style("stroke-dasharray", ("3, 3"));
            addPremiumPriceMarker(svg, xScale(option.strikePrice + option.premium), midHeight);
        } else {
            lineUpToStrikePrice.style("stroke-dasharray", ("3, 3"));
            addPremiumPriceMarker(svg, xScale(option.strikePrice - option.premium), midHeight);
        }

        addUnderlyingPurchasePriceMarker(svg, xScale(option.underlyingCommodityPriceAtPurchase), midHeight);

        addCurrentPriceMarker(svg, xScale(currentPrice), midHeight);

        addPriceToolTips(container, svg, option, currentPrice);

    }


    function addUnderlyingPurchasePriceMarker(svg, x, y) {
        svg.append("circle")
                .attr("cx", function(d) { return x; })
                .attr("cy", y)
                .attr("r", 2)
        ;
    }


    function addPremiumPriceMarker(svg, x, y) {
        svg.append("line")
                .attr("x1", function(d) { return x; })
                .attr("y1", y - 3)
                .attr("x2", function(d) { return x; })
                .attr("y2", y + 3)
                .attr("stroke-width", 2)
                .attr("stroke", "red")
        ;

    }


    function addCurrentPriceMarker(svg, x, y) {

        var color = "green";
        var triangleSize = 25;
        var sqrt3 = Math.sqrt(3);
        var verticalTranslation = y + Math.sqrt(triangleSize / (sqrt3 * 3)) * 2;

        var triangle = d3.symbol()
                .type(d3.symbolTriangle)
                .size(triangleSize)
        ;

        svg.append("path")
                .attr("d", triangle)
                .attr("stroke", color)
                .attr("fill", color)
                .attr("transform", function(d) { return "translate(" + x + "," + verticalTranslation + ")"; });
        ;

    }


    function addPriceToolTips(container, svg, option, currentPrice) {

        var currencyFormatter = d3.format("0,.2f");
        var adjustedPremium = option.strikePrice +
               (option.optionType === 'CALL' ? option.premium : -option.premium);

        var tooltipDiv = container
                .append("div")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .html("<table bgcolor='#FFFFFF'>" +
                     "<tr><td><b>current:</b></td><td><font color='green'>" + currencyFormatter(currentPrice) + "</font></td></tr>" +
                     "<tr><td><b>strike:</b></td><td><font color='grey'>" + currencyFormatter(option.strikePrice) + "</font></td></tr>" +
                     "<tr><td><b>premium delta:</b></td><td><font color='red'>" + currencyFormatter(adjustedPremium) + "</font></td></tr>" +
                     "<tr><td><b>historical:</b></td><td>" + currencyFormatter(option.underlyingCommodityPriceAtPurchase) + "</td></tr>" +
                     "</table>"
                )
                ;


        svg
                .on("mouseover", function() { return tooltipDiv.style("visibility", "visible"); })
                .on("mousemove", function() { return tooltipDiv.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px"); })
                .on("mouseout",  function() { return tooltipDiv.style("visibility", "hidden"); });

    }


})(a4);
