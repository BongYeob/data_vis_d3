class ViolinPlot {
    constructor(data) {
        this.data = data;
        this.margin = { top: 10, right: 30, bottom: 30, left: 40 };
        this.width = 960 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.svg = null;
        this.x = null;
        this.y = null;
        this.tooltip = null;
        this.popperInstance = null;
    }

    initialize() {
        d3.select("#violin").html("");
        this.svg = d3.select("#violin").append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.x = d3.scaleBand()
            .range([0, this.width])
            .domain([3, 4, 5, 6, 7])
            .padding(0.05);
        this.svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x));

        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, 1]);
        this.svg.append("g")
            .call(d3.axisLeft(this.y));

        this.tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("background", "#f9f9f9")
            .style("padding", "5px")
            .style("border", "1px solid #d3d3d3")
            .style("border-radius", "3px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    drawViolinPlots(selectedQualities) {
        const filteredData = this.data.filter(d => selectedQualities.includes(d.quality));
        const dataGrouped = d3.groups(filteredData, d => d.quality);
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
        const points = this.svg.selectAll("indPoints")
            .data(filteredData)
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
            .on("mouseout", () => this.hideTooltip());
    }

    showTooltip(event, d) {
        this.tooltip
            .style("opacity", 1)
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
        this.tooltip.style("opacity", 0);
        if (this.popperInstance) {
            this.popperInstance.destroy();
            this.popperInstance = null;
        }
    }

    update(selectedQualities) {
        this.initialize();
        this.drawViolinPlots(selectedQualities);
    }
}
