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
    "Ottoman+Lala Kara Mustafa Pasha+Tuscany+Battle+Mediterranean+Greek+Mediterranean+Philip II+Venetian+Venetian+Turks+Ottoman+Ottoman+Turkish+Tuscany+Spanish+Protestant Reformation+1851+bowmenThe Christian+Sami+Venice+Venice+Orsini+Venetian+Genoese Gianandrea Doria+Christians+Austria+Finlay+Christian+Spain+Venetian+Grand Duchy+Sirocco+Pisa+Catholic+Knights+Cyprus+Italian+Mahomet Sirocco+John+Ottoman Empire+Dalmatia+Savoy+Ali Pasha+Cavalieri+Christian+Holy League+Republic+Papal States+Lepanto+Venetian+Cyprus+Ottoman+Christian+Christian+West+Barbarigo+Álvaro+Holy League+Christian+Sultana+Return+Agostino Barbarigo+Naples+Mehmed Şuluk+Marcantonio Colonna+Real+Malta+Christian+Roman Marcantonio Colonna+John+Cyprus+George Finlay+Pope Pius V+Don Juan+Greeks+Marco Antonio Bragadin+Spanish+Sicily+Centre Division+Duchy+Kingdoms+Duchy+Colonna+Greeks+Andrea+Ottoman Empire+Victory+Venetian+Austria+Philip II+Lepanto+Sardinia+Modon+Eastern Mediterranean+Austria+Venier+Turkish+Adriatic+Melilla+Pope Pius V+Turkish+Knights+Empire+Venetians+Pope Pius V+1580+Sebastiano Venier+Ottomans+Saint Stephen+Venetian+Lepanto+Western+Janissaries+Knights+Venetian+Cyprus+Tuscany+1572+Greece+Ottoman+Republic+Ottoman+Battle+Ottomans+Christian+Paul K. Davis+Genoese Giovanni Andrea Doria+Kingdom+Real+Venetian+Alexandria+1574+Christian+Mehmed Sirocco+Dalmatia+Ottoman+Holy League+Lepanto+Salamis+Spain+Sultan Selim II+Naples+1571+Corinth+Philip II+Knights+Turks+Naupactus+Saint Stephen+Christian+Turkish+Christian+Doria+Holy League+Barbarigo+Austria+Tunis+Genoa+Spain+Lepanto+Cyprus+Messina+Urbino+Sicily+Pietro Giustiniani+Holy League+Holy League+Ottoman Empire+1571+Kingdom+John+Abdul Malik+European+Europe+Europe+Venetian+Italian+Christian+Turkish+cowardsThe+Spain+Spanish Empire+Dalmatian+Müezzinzade Ali Pasha+Spanish Empire+Ceuta+Spanish+Holy League+Christians+Pope Pius V+Bazán+Ali Pasha+Kingdom+Pope+Pisa+Left Division+Uluç Ali+Lepanto+Europe+Holy League+John+Sicily+Berbers+Saint Stephen+1572+Real+Lepanto+Christian+Marcantonio Colonna+Mediterranean+Spanish Empire+Venice+1576+Catholic+Christian+Famagusta+Holy League+Ottoman Empire+Greek+Doria+Ottoman+Austria+Turks+Christian+Colonna+Sebastiano Venier+Genoese+Spanish Crown+Holy League+Republic+Spanish+Uluç Ali+Holy League+Austria+Messina+Christian+Turks+Italian+Spanish+Papal States+League+Venetian+Selim II+Ottoman Empire+Christian+Savoy+Malta+Santo Stefano+Venier+Ottoman+Spanish+Jacopo Ligozzi+Lepanto+Republic+Ottoman+Marcantonio Barbaro+North+Real+Papal+Muslim+Venice+Mediterranean+Ottomans+Christians+Christian+Christian+Venice+Lepanto+Ottoman+Magnificent+African+Spain+John+1573+Western+Lepanto+Patras+Holy League+Venetian+Real+Spain+squadronsAli Pasha+Venetian+1574+1645+Ottoman+Spanish Tercio+John+Ottoman+Genoa+Naples+Kingdom+Cyprus+Holy League+Spanish Empire+Ottoman+Turkish+Doria+Turkish+Christendom+Gibraltar+Christians+Philip II+Venetian+Ali Pasha+Knights+Don Juan+Western+Patras+1573+Morocco+1571+Europe+Knights+Turks+Barbary+Uluç Ali+Battle+Lepanto+Germans+Friuli+thatThe+Mediterranean+1610+Knights+Battle+Paolo Giordano+Knights Hospitaller+Venetian+Kingdom+Europe+Spaniards+Turkish+Holy League+Papal States+Messina+Venice+Christian+Ottoman+Savoy+Italian+Cephalonia+1570+Republic+1571+Spanish+Ottoman+Grand Vizier Sokollu Mehmed Pasha+Nicosia+Turks+Val+Cyprus+Sebastiano Venier+Saint Stephen+Ottoman Empire+1572+Ottoman+Ottoman+Colonna+Marcantonio Colonna+Paul K. Davis+Venetian+Mediterranean Sea+Messina+1549+Fez+Malta+Don Juan+Syrians+Venetian+SicilyThe Christian+Christian+Ottoman Empire+Greeks+Grand Duchy+Don Juan+Ottoman+Sirocco+Holy League+Tunis+Oran+Turks+Mediterranean+Sacrament+Antonio+Ali+Barbarigo+Genoese Gianandrea Doria+Ottoman+Mehmed Siroco+Pope Pius V+Calabria+Kılıç Ali Pasha+Serious+Sirocco+Christian+Ali Pasha+John+Pius V+Habsburg+Ali Pasha+Naples+Venice+Turks+John+Doria+Uluç Ali+Malta+Ottoman Empire+Cretan+Greek+Venice+Porte+Ottoman+Marco Querini",
    "Peloponnese+Constantinople+Thomas+Golden Horn+Golden Horn+Ulubatlı Hasan+Venice+Conqueror+Archbishop+Great+Emperor+Constantinople+Ottoman+Byzantine Empire+Catalan+European+Harbour+Golden Horn Wall+Italians+1450+Palaiologoi+Baltoghlu+Golden Horn+Loukas Notaras+Studius+Branković+Ottomans+Blachernae+Bocchiardi+Karadja Pasha+Great Palace+Tedaldi+Pope Eugene IV+Constantine+Christian+Republic+Zagan Pasha+Niccolò Barbaro+Greek+Constantinople+Council+Mehmed+siegeConstantinople+Marmara+Turks+Halil Pasha+Mytilene Leonardo+Italy+Mehmed+Walls+Senate+Girolamo Minotto+Constantine+Greek+Giovanni Giustiniani+Walls+Greeks+Emperor+Southern Greece+John Justinian+Golden Horn+Roman Empire+Admiral Baltoghlu+1182+Christian+Genoese+1453+Ottoman+Ottoman+Mehmed+1274+Ottoman Empire+Byzantines+Venetian Crete+Hungarian+Pope+Edirne+Ottomans+Sicily+Gallipoli+Sultan+Epirus+Constantine XI+Venice+Ubertino Pusculo+Holy Roman Empire+Demetrios+Constantinople+Sea+ChioMehmed+Galata+Aegean+Venetian+Dorgano+Zagan Pasha+Hagia Sophia+Baltoghlu+Golden Horn+Genoese Chios+Emperor+Constantinople+Constantine+Mehmed+Genoa+Hagia Sophia+Pope+Via+Marmara+Reconquista+Galata+Manuel+Ghazis+France+Cardinal Isidore+Church+Rome+Galata+Golden Horn+Mehmed II+Rumeli+Land Wall+Turkish+Venetians+Venetians+Ottoman+Ottoman+Ottoman+Mehmed+Ottoman+Naples+Ottoman+San Romano+Orban+Latin+Adrianople+Fourth Crusade+Poland+Christian+Serbian+1452+Pope Nicholas V+1453+Italian+Sea+Byzantine+Constantinople+Neapolitan+Ottomans+Chio+Ottoman+Genoese+Genoa+soldiersThe Ottomans+metresThe+Ottoman+Constantinople+Nicaea+John VIII+Ottomans+Branković+Anatolian Turkmen+Byzantine+Russian+Babylon+1453+Mehmed+Emperor+Greeks+Byzantines+Jacobo Contarini+Langasco+1261+Constantinople+Balkans+Second Council+Union+Latins+West+Sultan Mehmed II+Petra+Pegae Gate+Rumeli Hisarı+Sea+Sea+Alviso Diedo+Turks+Baltoghlu+Edirne+Genoese+Genoese+European+Mehmed+Jacopo Tedaldi+Pope Nicholas+Mehmed+Late Middle Ages+Pope Nicholas V+Mehmed+Varna+German+Byzantines+Anadolu Hisarı+Gabriele Orsini+Nicolò Barbaro+Genoa+Ottoman+Giustiniani+Latin+Halil Pasha+Giustiniani+Byzantines+1500+Europe+Byzantine Empire+Constantinople+Greek+Mehmed+Latins+Bosphorus+1444+Western Europe+Archbishop Leonardo+Ottoman+Capital+Golden Horn+Venetian+Princes+Turks+Turakhan Beg+Hundred Years+Mehmed+Marmara+Barbaro+Constantine XI Palaiologos+Hungarian+Turkish+Mehmed+Mehmed+Church+France+Cardinal Isidore+Lycus+Vespers+Ottoman+Mehmed II+Karaca Pasha+Therapia+Constantinople+Trebizond+Mese+Nestor+Venetian+Spain+Palaiologos+Venice+Byzantine+Turkish+Emperor Constantine+Mehmed+Genoese+Cataneo+Pere Julià+Venetian+Greeks+Demetrius Cantacuzenus+Spanish+Pope+Mehmed II+Byzantine+Byzantines+Marmara+Mehmed II+Bulgarians+Leonardo+Latins+Golden Horn+Roman+1204+Constantinople+Holy Apostles+Emperor+Ottomans+Emperor Constantine XI Palaiologos+Bosphorus+Kingdoms+Fourth Crusade+Christian+Mehmed+Golden Horn+Venetians+David Nicolle+West+Golden+Byzantine+Edirne+Mehmed+Byzantine Empire+Emperor+Princes+Venosa+Latin Church+Venetian+Byzantine Empire+Golden Horn+Venetian+Lycus+Mehmed+Golden Gate+Constantinople+Ishak Pasha+Venetians+Turkish+Augusteum+Emperor+Byzantine Empire+Ottoman+Kiev+Ottoman Army+Turkish+Hungary+Florentine+Battle+1453+Byzantines+Constantinople+Saruca+Sphrantzes+Byzantines+Ottoman+Isidore+Gabriele Trevisano+Orban+Novo Brdo+Europe+Ottoman Empire+1346+Ottoman Turks+Horn+Constantinople+Black Sea+Lyon+Genoese+Horn+Greek+Sultan+1451+Mehmed+Forty Italians+Teodoro Caristo+Golden Horn+Sultan+1204+Turkmen+Bosphorus+Sea+Greek+Anatolia+Mystras+Byzantine+Golden Horn+Pera+Venetian+1452+Roman+Black Death+Florence+Emperor Constantine XI+Constantinople+Western+Ottoman+Ottoman+Christian+Boğazkesen+Greek+Constantinople+Byzantine+Kiev+Archbishop Leonardo+Orban+waterThe+European+Luckily+Great+Massacre+1349+Greek+Turkish+Constantinople+Giustiniani+Kiev+Charisian Gate+Chios+Venetians+Michael Critobulus+Peloponnese+Pegae Gate+Byzantine Emperor Michael+Constantinople+Turkish+Constantinople+Empire of Trebizond+Golden+England+Ottomans+Stoudion+Filippo Contarini+George Sphrantzes+Barbaro+Black+Latins+Giustiniani+Constantinople+Serbian+Ancona+Fourth Crusade+Venetian+Holy Apostles+Greek+Golden+Aegean+1452+Ugento+Emperor John+Byzantine+1452+Balzo+Johannes Grant+Genoese+Genoese+Constantinople+Saruca+Turks+Zagan Pasha+Niccolò Barbaro+Saruca+Urban+Western+Joan de+Byzantine+Orban+1204+1439+Rumelia+Prince Orhan+Byzantine Church+Marmara+Constantinople+Byzantine Emperor Constantine XI+Byzantine+1453+Byzantines+Sultan+European+Byzantines+Venetian+Constantinople+1453+Golden Horn+Constantinople+Great Logothete George Sphrantzes+Giovanni Giustiniani+Cardinal Isidore+Blachernae+Genoese+Blachernae Palace+Mehmed+Mehmed II+Theodosian+Serbs+1452+Mehmed II+Venetian+Golden Horn+Nicephorus Palaeologus+Turkish+Aragon+Ottomans+Eleutherios"
    ]

function calculateFrequency(arr) {
    return arr.reduce(function(countMap, word) {
        word = word.toLowerCase(); // 可以忽略大小写
        countMap[word] = (countMap[word] || 0) + 1;
        return countMap;
    }, {});
}

function getWords(i) {
    var cals = words[i].replace(/[!\,:;\?]/g, '').split('+')
    var frequency = calculateFrequency(cals);
    return cals.map(function(d) {
                var base = 9 + Math.random() * 45;
                var normalizedWord = d.toLowerCase();
                var count = (frequency[normalizedWord] + 1 > 10) ? 10 : frequency[normalizedWord] + 1;
                var acc = 1 + (count - 1) / (10 - 1);
                if (d.match(/^\d{4}$/)) {
                    acc += 0.3;
                }
                return {text: d, size: base * acc };
            })
}

function showNewWords(vis, i) {
    i = i || 0;
    vis.update(getWords(i ++ % words.length))
    setTimeout(function() { showNewWords(vis, i + 1)}, 2000)
}

//Create a new instance of the word cloud visualisation.
var myWordCloud = wordCloud('.post-container');

//Start cycling through the demo data
showNewWords(myWordCloud);
