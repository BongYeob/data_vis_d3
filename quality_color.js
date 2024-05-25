const qualityColorDiv = d3.select(".quality-color");

for (let i = 0; i < 5; i++)
    qualityColorDiv.append("div");

const colors = d3.schemeCategory10.slice(0, 5);
d3.selectAll(".quality-color div")
    .style("background-color", (d, i) => colors[i]);