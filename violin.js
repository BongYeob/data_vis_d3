class ViolinPlot {
    constructor(tooltipId, data) {
        this.data = data;
        this.filteredData = data;
        this.tooltipId = tooltipId;
        this.tooltip = d3.select(tooltipId);
        this.margin = { top: 20, right: 20, bottom: 30, left: 20 };
        this.width = 960 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.svg = null;
        this.x = null;
        this.y = null;
        this.popperInstance = null;
        this.keysOrder = [
            "quality", "residual sugar", "density", "chlorides", "fixed acidity", 
            "volatile acidity", "citric acid", "pH", "free sulfur dioxide", 
            "total sulfur dioxide", "sulphates", "alcohol"
        ];
    }

    initialize() {
        d3.select("#violin").html("");
        const tbody = d3.select("#data-table tbody");
        tbody.selectAll("tr").remove();
        this.svg = d3.select("#violin").append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.tooltip = d3.select(this.tooltipId);

        this.x = d3.scaleBand()
            .range([0, this.width])
            .domain([3, 4, 5, 6, 7])
            .padding(0.05);
        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x))
            .append("text")
            .attr("class", "axis-label")
            .attr("x", this.width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("quality");

        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, 1]);
        this.svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(this.y))
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("free sulfur dioxide / total sulfur dioxide");

        d3.select("#violin").on("mousedown", (event) => this.startDrag(event));
        d3.select("#violin").on("mousemove", (event) => this.drag(event));
        d3.select("#violin").on("mouseup", () => this.endDrag());
    }
    startDrag(event) {
        this.isDragging = true;
        this.handleMouseEvent(event);
    }
    
    drag(event) {
        if (this.isDragging) {
            this.handleMouseEvent(event);
        }
    }
    
    endDrag() {
        this.isDragging = false;
    }
    drawViolinPlots(selectedQualities) {
        this.filteredData = this.data.filter(d => selectedQualities.includes(d.quality));

        const dataGrouped = d3.groups(this.filteredData, d => d.quality);

        const histogram = d3.histogram()
            .domain(this.y.domain())
            .thresholds(this.y.ticks(20))
            .value(d => d.fs_ratio);

        const sumstat = dataGrouped.map(([key, values]) => {
            const bins = histogram(values);
            return { key, bins };
        });

        let maxNum = 0;
        sumstat.forEach(d => {
            const lengths = d.bins.map(a => a.length);
            const longest = d3.max(lengths);
            if (longest > maxNum) { maxNum = longest; }
        });

        const xNum = d3.scaleLinear()
            .range([0, this.x.bandwidth()])
            .domain([-maxNum, maxNum]);

        this.svg.selectAll("myViolin")
            .data(sumstat)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${this.x(d.key)}, 0)`)
            .append("path")
            .datum(d => d.bins)
            .style("stroke", "none")
            .style("fill", "grey")
            .attr("d", d3.area()
                .x0(xNum(0))
                .x1(d => xNum(d.length))
                .y(d => this.y(d.x0))
                .curve(d3.curveCatmullRom)
            );

        const jitterWidth = 50;
        this.svg.selectAll("indPoints")
            .data(this.filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => this.x(d.quality) + this.x.bandwidth() / 2 - Math.random() * jitterWidth)
            .attr("cy", d => this.y(d.fs_ratio))
            .attr("r", 3)
            .style("fill", d => {
                const baseColor = d3.schemeCategory10[d.quality - 3];
                return d3.interpolateRgb("white", baseColor)(d.fs_ratio);
            })
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", () => this.hideTooltip())
    }

    showTooltip(event, d) {
        this.tooltip
            .style("display", "block")
            .select(".tooltip-inner")
            .html(`Free Sulfur Dioxide: ${d['free sulfur dioxide']}<br>Total Sulfur Dioxide: ${d['total sulfur dioxide']}`);

        this.popperInstance = Popper.createPopper(event.target, this.tooltip.node(), {
            placement: 'top',
            modifiers: [{
                name: 'offset',
                options: {
                    offset: [0, 8],
                },
            }],
        });
    }

    hideTooltip() {
        this.tooltip.style("display", "none");
        if (this.popperInstance) {
            this.popperInstance.destroy();
            this.popperInstance = null;
        }
    }

    handleMouseEvent(event) {
        const [mouseX, mouseY] = d3.pointer(event, this.svg.node());
        const clickedYValue = this.y.invert(mouseY);
    
        const matchingData = this.filteredData.filter(d => Math.abs(d.fs_ratio - clickedYValue) < 0.01); // 0.01 오차 범위

        this.updateTable(matchingData);
    
        this.svg.selectAll(".clicked-line").remove();
        this.svg.append("line")
            .attr("class", "clicked-line")
            .attr("x1", 0)
            .attr("x2", this.width)
            .attr("y1", this.y(clickedYValue))
            .attr("y2", this.y(clickedYValue))
            .attr("stroke", "red")
            .attr("stroke-width", 1);
    }

    updateTable(data) {
        const sortedData = data.sort((a, b) => a.quality - b.quality);
    
        const tbody = d3.select("#data-table tbody");
        tbody.selectAll("tr").remove();
    
        sortedData.forEach(d => {
            const row = tbody.append("tr");
            this.keysOrder.forEach(key => {
                row.append("td").text(() => {
                    let value = d[key];
                    return (typeof value === "number" && value.toString().split(".")[1]?.length > 6)? value.toFixed(6): value;
                });
            });
        });
    }

    update(selectedQualities) {
        this.initialize();
        this.drawViolinPlots(selectedQualities);
    }
}
