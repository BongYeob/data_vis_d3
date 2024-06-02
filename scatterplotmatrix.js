class ScatterPlotMatrix {
    constructor(data) {
        this.data = data;
        this.size = 200;
        this.padding = 50;
        this.svg = null;
        this.xScales = {};
        this.yScales = {};
    }

    initialize(attributes) {
        d3.select("#scatter").html("");
        this.svg = d3.select("#scatter").append("svg")
            .attr("width", this.size * attributes.length + this.padding)
            .attr("height", this.size * attributes.length + this.padding)
            .append("g")
            .attr("transform", `translate(${this.padding / 2}, ${this.padding / 2})`);

        attributes.forEach(attr => {
            this.xScales[attr] = d3.scaleLinear()
                .domain(d3.extent(this.data, d => d[attr]))
                .range([this.padding / 2, this.size - this.padding / 2]);

            this.yScales[attr] = d3.scaleLinear()
                .domain(d3.extent(this.data, d => d[attr]))
                .range([this.size - this.padding / 2, this.padding / 2]);
        });
    }

    drawScatterPlots(selectedQualities, attributes) {
        const filteredData = this.data.filter(d => selectedQualities.includes(d.quality));
        const scatterPlotMatrix = this;

        const drag = d3.drag()
            .on("start", function (event, d) {
                d3.select(this).raise().classed("active", true);
            })
            .on("drag", function (event, d) {
                d3.select(this).attr("x", d.x = event.x).attr("y", d.y = event.y).style("opacity", 0.5);
            })
            .on("end", function (event, d) {
                d3.select(this).classed("active", false);
                const mouseX = event.sourceEvent.clientX;
                const mouseY = event.sourceEvent.clientY;
                const element = document.elementFromPoint(mouseX, mouseY);
                const gridSize = scatterPlotMatrix.size + scatterPlotMatrix.padding / 2;

                if (element && element.closest('svg')) {
                    const svgBounds = scatterPlotMatrix.svg.node().getBoundingClientRect();
                    const relativeX = mouseX - svgBounds.left;
                    const relativeY = mouseY - svgBounds.top;
                    const targetCol = Math.floor(relativeX / gridSize);
                    const targetRow = Math.floor(relativeY / gridSize);

                    if (targetCol >= 0 && targetCol < attributes.length && targetRow === targetCol) {
                        const sourceIndex = attributes.indexOf(d3.select(this).text());
                        const targetIndex = targetCol;

                        if (sourceIndex !== targetIndex) {
                            [attributes[sourceIndex], attributes[targetIndex]] = [attributes[targetIndex], attributes[sourceIndex]];
                            scatterPlotMatrix.update(selectedQualities, attributes);
                        }
                    } else {
                        scatterPlotMatrix.update(selectedQualities, attributes);
                    }
                } else {
                    scatterPlotMatrix.update(selectedQualities, attributes);
                }
            });

        attributes.forEach((col1, i) => {
            attributes.forEach((col2, j) => {
                const cell = this.svg.append("g")
                    .attr("transform", `translate(${i * this.size}, ${j * this.size})`);

                if (i === j) {
                    cell.append("text")
                        .datum({ x: this.size / 2, y: this.size / 2 })
                        .attr("class", "cell-label")
                        .attr("x", this.size / 2)
                        .attr("y", this.size / 2)
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .text(col1)
                        .call(drag);
                } else {
                    cell.selectAll("circle")
                        .data(filteredData)
                        .enter().append("circle")
                        .attr("cx", d => this.xScales[col1](d[col1]))
                        .attr("cy", d => this.yScales[col2](d[col2]))
                        .attr("r", 2.5)
                        .attr("fill", d => d3.schemeCategory10[d.quality - 3]);

                    cell.append("g")
                        .attr("transform", `translate(0, ${this.size - this.padding / 2})`)
                        .call(d3.axisBottom(this.xScales[col1]).ticks(5));

                    cell.append("g")
                        .attr("transform", `translate(${this.padding / 2}, 0)`)
                        .call(d3.axisLeft(this.yScales[col2]).ticks(5));
                }
            });
        });
    }

    update(selectedQualities, attributes) {
        this.initialize(attributes);
        this.drawScatterPlots(selectedQualities, attributes);
    }
}
