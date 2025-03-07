import nltk
import re
import sys
import random
from jsmin import jsmin

word_cloud_js_template = '''
var words = {FILLIN}

function wordCloud(selector) {{
    var fill = d3.scale.category20();
    var svg = d3.select(selector).append("svg")
    .attr("width", 1000)
    .attr("height", "auto")
    .attr("max-height", "100%")
    .attr("viewBox", "0 0 1000 600")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", "translate(500,300)");

    function draw(words) {{
        var cloud = svg.selectAll("g text")
        .data(words, function(d) {{ return d.text; }})

        //Entering words
        cloud.enter()
            .append("text")
            .style("font-family", "Impact")
            .style("fill", function(d, i) {{ return fill(i); }})
            .attr("text-anchor", "middle")
            .attr('font-size', 1)
            .text(function(d) {{ return d.text; }});

        cloud
            .transition()
                .duration(600)
                .style("font-size", function(d) {{ return d.size + "px"; }})
                .attr("transform", function(d) {{
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                }})
                .style("fill-opacity", 1);

        cloud.exit()
            .transition()
                .duration(200)
                .style('fill-opacity', 1e-6)
                .attr('font-size', 1)
                .remove();
    }}

    return {{

        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function(words) {{
            d3.layout.cloud().size([1000, 600])
                .words(words)
                .padding(1)
                .spiral("archimedean")
                .rotate(function() {{ return (~~(Math.random() * 4) - 2) * 30; }})
                .font("Impact")
                .fontSize(function(d) {{ return d.size; }})
                .on("end", draw)
                .start();
        }}
    }}

}}

function calculateFrequency(arr) {{
    return arr.reduce(function(countMap, word) {{
        word = word.toLowerCase(); // 可以忽略大小写
        countMap[word] = (countMap[word] || 0) + 1;
        return countMap;
    }}, {{}});
}}

function getWords(i) {{
    var cals = words[i].replace(/[!\,:;\?]/g, '').split('+')
    var frequency = calculateFrequency(cals);
    return cals.map(function(d) {{
                var base = Math.random() * 60; // 0 - 120 (60 * 2.5 * 0.8)
                var normalizedWord = d.toLowerCase();
                var count = (frequency[normalizedWord] + 1 > 10) ? 10 : frequency[normalizedWord] + 1;
                var acc = 1 + (count - 1) / (10 - 1);
                if (d.match(/^\d{{4}}$/)) {{
                    acc += 0.15;
                }}
                if (/\s/.test(d) && d.length < 20) {{
                    acc += 0.35
                }}
                var size = base * acc * 0.8;
                var r = Math.random();
                if (size > 80) {{
                    size -= (size - 60) * r
                }}
                if (size < 40) {{
                    size += r * (60 - size)
                }}
                return {{text: d, size: size }};
            }})
}}

function showNewWords(vis, i) {{
    i = i || 0;
    vis.update(getWords(i ++ % words.length))
    setTimeout(function() {{ showNewWords(vis, i)}}, 1800)
}}

var myWordCloud = wordCloud('.about-page');

showNewWords(myWordCloud);
'''


def nouns(text):
    # Ensure that you have the necessary data to perform POS tagging
    nltk.download('averaged_perceptron_tagger')
    nltk.download('punkt')

    # Tokenize the text (split it into words)
    words = nltk.word_tokenize(text)

    # Perform POS tagging
    tagged_words = nltk.pos_tag(words)

    # Extract all nouns (common and proper nouns typically are tagged as NN and NNP)
    nouns = [word for word, tag in tagged_words if tag in ('NN', 'NNS', 'NNP', 'NNPS', 'CD', 'RP', 'SYM', 'FW')]

    return " ".join([w for w in nouns if ( (len(w) > 1 or w.istitle()) and not w.isdigit()) or (w.isdigit() and len(w) >= 4 )])


def entity(text):
    nltk.download('maxent_ne_chunker')
    nltk.download('words')

    def extract_entity_names(tree):
        names = []

        if hasattr(tree, 'label') and tree.label:
            if tree.label() in ('PERSON', 'ORGANIZATION', 'GPE', 'LOCATION', 'DATE', 'FACILITY'):
                names.append(' '.join([child[0] for child in tree]))
            else:
                for child in tree:
                    names.extend(extract_entity_names(child))

        return names

    # 分词
    tokens = nltk.word_tokenize(text)
    # 词性标注
    tagged = nltk.pos_tag(tokens)

    years = [word for word, tag in tagged if re.compile(r'\b(11|12|13|14|15|16|17|18|19|20)\d{2}\b').match(word)]

    entities = nltk.chunk.ne_chunk(tagged)
    names = extract_entity_names(entities)

    return names + years

def read_text(filename):
    try:
        with open(filename, 'r') as file:
            content = file.read()
            # 移除换行符
            return content.replace('\n', '')

    except FileNotFoundError:
        print(f"文件 '{filename}' 未找到。")
    except Exception as e:
        print(f"读取文件时发生错误: {e}")


def fill_js_template(content_list):

    fillin = "["
    for content in content_list:
        fillin += '"' + content + '",'
    fillin = fillin[:-1] + "]"

    js = word_cloud_js_template.format(FILLIN=fillin)
    return jsmin(js)




if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("请提供一个文件名作为参数。")
        print("用法: python script.py <filename>")
    else:
        content_list = []

        filenames = sys.argv[1:]
        for filename in filenames:
            print("处理文件: ", filename)
            text = read_text(filename)
            entities = entity(text)
            random.shuffle(entities)
            content_list.append("+".join(entities))

        js = fill_js_template(content_list)

        print('\n' + js + '\n')




