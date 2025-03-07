var words = [""];
function wordCloud(selector) {
    var fill = d3.scale.category20();
    var svg = d3.select(selector).append("svg").attr("width", 1000).attr("height", 600).attr("viewBox", "0 0 1000 600").attr("preserveAspectRatio", "xMidYMid meet").append("g").attr("transform", "translate(500,300)");
    function draw(words) {
        var cloud = svg.selectAll("g text").data(words,
        function(d) {
            return d.text
        });
        cloud.enter().append("text").style("font-family", "Microsoft Yahei, sans-serif").style("font-weight", "bold").style("fill",
        function(d, i) {
            return fill(i)
        }).attr("text-anchor", "middle").attr('font-size', 1).text(function(d) {
            return d.text
        });
        cloud.transition().duration(1000).style("font-size",
        function(d) {
            return d.size + "px"
        }).attr("transform",
        function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
        }).style("fill-opacity", 1);
        cloud.exit().transition().duration(200).style('fill-opacity', 1e-6).attr('font-size', 1).remove()
    }
    return {
        update: function(words) {
            d3.layout.cloud().size([1000, 600]).words(words).padding(1).rotate(function() {
                return 0
            }).font("Microsoft Yahei, sans-serif").fontSize(function(d) {
                return d.size
            }).on("end", draw).start()
        }
    }
}
function getWords(i) {
    var cals = words[i].replace(/[!\,:;\?]/g, '').split('+');
    var randomWords = [];
    while (randomWords.length < 60) {
        var randomIndex = Math.floor(Math.random() * cals.length);
        if (!randomWords.includes(cals[randomIndex])) {
            randomWords.push(cals[randomIndex])
        }
    }
    return randomWords.map(function(d) {
        return {
            text: d,
            size: generateRandomInteger()
        }
    })
}
function showNewWords(vis, i) {
    i = i || 0;
    vis.update(getWords(i++%words.length));
    setTimeout(function() {
        showNewWords(vis, i)
    },
    1800)
}
function customRandom() {
    const rand = Math.random();
    if (rand < 0.6) {
        return 20 + Math.random() * 40
    } else if (rand < 0.8) {
        return 20 - Math.sqrt(Math.random()) * 10
    } else {
        return 100 - Math.sqrt(Math.random()) * 40
    }
}
function generateRandomInteger() {
    return Math.round(customRandom())
}
var myWordCloud = wordCloud('.about-page');
showNewWords(myWordCloud);
