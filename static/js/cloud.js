function wordCloud(selector) {

    var fill = d3.scale.category20();

    //Construct the word cloud's SVG element
    var svg = d3.select(selector).append("svg")
    .attr("width", "100%")     // SVG宽度设置为100%，使其宽度等于父元素的宽度
    .attr("height", 600)       // 高度可以设置为固定值或者百分比
    .attr("viewBox", "0 0 600 600") // viewBox定义了SVG内部坐标系统所见的区域
    .attr("preserveAspectRatio", "xMidYMid meet") // 控制SVG内部元素的保持比例和位置
    .append("g")
    .attr("transform", "translate(300,300)"); // 设定内部g元素的位置

    //Draw the word cloud
    function draw(words) {
        var cloud = svg.selectAll("g text")
                        .data(words, function(d) { return d.text; })

        //Entering words
        cloud.enter()
            .append("text")
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr('font-size', 1)
            .text(function(d) { return d.text; });

        //Entering and existing words
        cloud
            .transition()
                .duration(600)
                .style("font-size", function(d) { return d.size + "px"; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("fill-opacity", 1);

        //Exiting words
        cloud.exit()
            .transition()
                .duration(200)
                .style('fill-opacity', 1e-6)
                .attr('font-size', 1)
                .remove();
    }


    //Use the module pattern to encapsulate the visualisation code. We'll
    // expose only the parts that need to be public.
    return {

        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function(words) {
            d3.layout.cloud().size([500, 500])
                .words(words)
                .padding(2)
                .rotate(function() { return ~~(Math.random() * 2) * 60; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .on("end", draw)
                .start();
        }
    }

}

//Some sample data - http://en.wikiquote.org/wiki/Opening_lines
var words = [
    "The Christian fleet consisted of 206 galleys and six galleasses (large new galleys with substantial artillery, developed by the Venetians). John of Austria, half-brother of Philip II of Spain, was named by Pope Pius V as overall commander of the fleet and led the centre division, with his principal deputies and counselors being the Roman Marcantonio Colonna and the Venetian Sebastiano Venier; the wings were commanded by the Venetian Agostino Barbarigo and the Genoese Gianandrea Doria.[25][26] The Republic of Venice contributed 109 galleys and six galleasses, 49 galleys came from the Spanish Empire (including 26 from the Kingdom of Naples, the Kingdom of Sicily, and other Italian territories), 27 galleys of the Genoese fleet, seven galleys from the Papal States, five galleys from the Order of Saint Stephen and the Grand Duchy of Tuscany, three galleys each from the Duchy of Savoy and the Knights of Malta, and some privately owned galleys in Spanish service. This fleet of the Christian alliance was manned by 40,000 sailors and oarsmen. In addition, it carried approximately 30,000[27][28] fighting troops: 7,000 Spanish Empire regular infantry of excellent quality,[29] (4,000 of the Spanish Empire's troops were drawn from the Kingdom of Naples, mostly Calabria),[30] 7,000 Germans,[31] 6,000 Italian mercenaries in Spanish pay, all good troops,[31] in addition to 5,000 professional Venetian soldiers.[32] A significant number of Greeks also participated in the conflict on the side of the Holy League with three Venetian galleys commanded by Greek captains.[33] The historian George Finlay estimated that over 25,000 Greeks fought on the side of the Holy League during the battle (both as soldiers and sailors/oarsmen) and stated that their numbers far exceeded that of the combatants of any other nation engaged.[34]Oarsmen were mainly drawn from local Greek populations, who were experienced in maritime affairs,[33] although there were some Venetian oarsmen as well.[35] Free oarsmen were generally acknowledged to be superior to enslaved or imprisoned oarsmen, but the former were gradually replaced in all galley fleets (including those of Venice from 1549) during the 16th century by cheaper slaves, convicts, and prisoners-of-war owing to rapidly rising costs.[36] The Venetian oarsmen were mainly free citizens and able to bear arms, adding to the fighting power of their ships, whereas convicts were used to row many of the galleys in other Holy League squadrons.[35]"
    ]

//Prepare one of the sample sentences by removing punctuation,
// creating an array of words and computing a random size attribute.
function getWords(i) {
    return words[i]
            .replace(/[!\.,:;\?]/g, '')
            .split(' ')
            .map(function(d) {
                return {text: d, size: 10 + Math.random() * 45};
            })
}

//This method tells the word cloud to redraw with a new set of words.
//In reality the new words would probably come from a server request,
// user input or some other source.
function showNewWords(vis, i) {
    i = i || 0;

    vis.update(getWords(i ++ % words.length))
    setTimeout(function() { showNewWords(vis, i + 1)}, 2500)
}

//Create a new instance of the word cloud visualisation.
var myWordCloud = wordCloud('.post-container');

//Start cycling through the demo data
showNewWords(myWordCloud);
