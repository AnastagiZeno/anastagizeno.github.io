import sys
import jieba.analyse

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

def extract_words(text):
    keywords = jieba.analyse.textrank(text, topK=650, withWeight=False, allowPOS=('nt','n','nr','ns','vn','vd','an'))
    print("+".join(keywords))
    # for keyword, weight in keywords:
    #     print(f"{keyword}: {weight}")


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
            extract_words(text)

