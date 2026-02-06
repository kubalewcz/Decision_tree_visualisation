document.addEventListener("DOMContentLoaded", () => {
    if (!window.TREE_DATA) return;

    const jsonData = window.TREE_DATA;
    let baseTranslate = { x: 0, y: 0 };

    function convertToD3Hierarchy(data) {
        if (!data) return null;

        const node = {
            name: data.feature || data.label || "root",
            type: data.type,
            entropy: data.entropy,
            majority_class: data.majority_class,
            all_gains: data.all_gains || {},
            children: []
        };

        if (data.children) {
            for (const [label, child] of Object.entries(data.children)) {
                const childNode = convertToD3Hierarchy(child);
                if (childNode) {
                    childNode.linkLabel = label;
                    node.children.push(childNode);
                }
            }
        }
        return node;
    }

    const treeData = convertToD3Hierarchy(jsonData);

    const margin = { top: 40, right: 90, bottom: 50, left: 90 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#tree")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        const zoom = d3.zoom().on("zoom", e => {

    g.attr(
        "transform",
        `translate(${baseTranslate.x + e.transform.x},
                   ${baseTranslate.y + e.transform.y})
         scale(${e.transform.k})`
        );
    });

    svg.call(zoom);



    let i = 0;
    const treeLayout = d3.tree().nodeSize([150, 100]);
    const root = d3.hierarchy(treeData);

    root.children?.forEach(d => {
        d._children = d.children;
        d.children = null;
    });



    update(root);


    // ---------- BUTTONS ----------
    document.getElementById("expandAll")?.addEventListener("click", () => {
        root.descendants().forEach(d => {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
        });
        update(root);
    });

    document.getElementById("collapseAll")?.addEventListener("click", () => {
        root.descendants().forEach(d => {
            if (d.children && d.depth > 0) {
                d._children = d.children;
                d.children = null;
            }
        });
        update(root);
    });

    // ---------- UPDATE ----------
    function update(source) {
        treeLayout(root);

        const nodes = root.descendants();
        const links = root.links();
        const [minX, maxX] = d3.extent(nodes, d => d.x);
        const treeWidth = maxX - minX;
        baseTranslate.x = (width - treeWidth) / 2 - minX;
        baseTranslate.y = 0 + 50;

        g.attr(
          "transform",
          `translate(${baseTranslate.x}, ${baseTranslate.y})`
        );

        // ----- NODES -----
        const node = g.selectAll("g.node")
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d =>
                `translate(${source.x0 ?? d.x},${source.y0 ?? d.y})`
            )
            .on("click", click)
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);

        nodeEnter.append("rect")
            .attr("width", 120)
            .attr("height", 50)
            .attr("x", -60)
            .attr("y", -25)
            .attr("fill", d => d.data.type === "leaf" ? "lightgreen" : "white")
            .attr("stroke", "steelblue");

        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -18)
            .html(d => {
                const f = d.data.type !== "leaf"
                    ? `<tspan x="0" dy="1.2em">${d.data.name}</tspan>`
                    : "";
                const e = typeof d.data.entropy === "number"
                    ? `<tspan x="0" dy="1.2em">H=${d.data.entropy.toFixed(2)}</tspan>`
                    : "";
                const c = d.data.type === "leaf"
                    ? `<tspan x="0" dy="1.2em">${d.data.majority_class}</tspan>`
                    : "";
                return f + e + c;
            });

        nodeEnter.merge(node)
            .transition().duration(750)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        node.exit().remove();

        // ----- LINKS -----
        const link = g.selectAll("path.link")
            .data(links, d => d.target.id);

        link.enter()
            .insert("path", "g")
            .attr("class", "link")
            .merge(link)
            .transition().duration(750)
            .attr("d", d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            );

        link.exit().remove();

        // ----- LINK LABELS -----
        const label = g.selectAll(".link-label")
            .data(links, d => d.target.id);

        label.enter()
            .append("text")
            .attr("class", "link-label")
            .attr("text-anchor", "middle")
            .merge(label)
            .attr("transform", d =>
                `translate(${(d.source.x + d.target.x) / 2},
                           ${(d.source.y + d.target.y) / 2})`
            )
            .text(d => d.target.data.linkLabel);

        label.exit().remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // ---------- INTERACTION ----------
    function click(event, d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    // ---------- TOOLTIP ----------
    const tooltip = d3.select("#tooltip");

    function showTooltip(event, d) {
        if (!d.data.all_gains || d.data.type === "leaf") return;

        tooltip
            .style("opacity", 1)
            .html(
                Object.entries(d.data.all_gains)
                    .map(([k, v]) => `<strong>${k}:</strong> ${v.toFixed(3)}`)
                    .join("<br>")
            )
            .style("left", `${event.pageX + 8}px`)
            .style("top", `${event.pageY - 20}px`);
    }

    function hideTooltip() {
        tooltip.style("opacity", 0);
    }
});


document.getElementById("runForm")?.addEventListener("submit", () => {
    sessionStorage.setItem("scrollY", window.scrollY);
});

window.addEventListener("load", () => {
    const y = sessionStorage.getItem("scrollY");
    if (y !== null) {
        window.scrollTo(0, parseInt(y, 10));
        sessionStorage.removeItem("scrollY");
    }
});

