class BubblePlot {
    constructor(data) {
        this.originalData = data;
        this.data = data;
        this.margin = {top: 20, right: 20, bottom: 30, left: 40};
        this.width = 960 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.svg = null;
        this.scales = {};
        this.isClick = false;

        this.xAttribute = null;
        this.yAttribute = null;
    }

    initialize(xAttribute, yAttribute) {
        d3.select("#bubble").html("");
        this.svg = d3.select("#bubble").append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.xAttribute = xAttribute;
        this.yAttribute = yAttribute;

        this.scales.x = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d[xAttribute]))
            .range([0, this.width])
            .nice();

        this.scales.y = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d[yAttribute]))
            .range([this.height, 0])
            .nice();

        this.scales.z = d3.scaleSqrt()
            .domain(d3.extent(this.data, d => d["alcohol"]))
            .range([2, 20]);

        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.scales.x))
            .append("text")
            .attr("class", "axis-label")
            .attr("x", this.width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text(xAttribute);

        this.svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(this.scales.y))
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(yAttribute);
    }

    drawBubblePlot(selectedQualities, xAttribute, yAttribute) {
        const filteredData = this.data.filter(d => selectedQualities.includes(d.quality));
        const bubbles = this.svg.selectAll(".bubble")
            .data(filteredData, d => d.id);

        bubbles.exit().transition().duration(1000).style("opacity", 0).remove();

        bubbles.enter().append("circle")
            .attr("class", "bubble")
            .attr("cx", d => this.scales.x(d[xAttribute]))
            .attr("cy", d => this.scales.y(d[yAttribute]))
            .attr("r", d => this.scales.z(d["alcohol"]))
            .attr("fill", d => d3.schemeCategory10[d.quality - 3])
            .on("click", (event, d) => this.handleBubbleClick(d, selectedQualities))
            .on("mouseover", (event, d) => this.handleMouseOver(d))
            .merge(bubbles)
            .attr("cx", d => this.scales.x(d[xAttribute]))
            .attr("cy", d => this.scales.y(d[yAttribute]))
            .attr("r", d => this.scales.z(d["alcohol"]))
            .style("stroke", "white");
    }

    handleMouseOver(d) {
        const radius = (d["alcohol"]);
        d3.select("#min").html("Alcohol : "+radius);
    }

    handleBubbleClick(d, selectedQualities) {
        this.isClick = true;
        const radius = d["alcohol"];
        this.data = this.data.filter(data => data["alcohol"] >= radius);
        this.drawBubblePlot(selectedQualities, this.xAttribute, this.yAttribute);
    }

    update(selectedQualities, xAttribute, yAttribute) {
        if(this.isClick === false)
            this.data = this.originalData;
        this.initialize(xAttribute, yAttribute);
        this.drawBubblePlot(selectedQualities, xAttribute, yAttribute);
    }
}
