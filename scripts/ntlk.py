import nltk
import re
import sys
import random



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


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("请提供一个文件名作为参数。")
        print("用法: python script.py <filename>")
    else:
        filename = sys.argv[1]
        text = read_text(filename)
        entities = entity(text)
        random.shuffle(entities)
        print("+".join(entities))
