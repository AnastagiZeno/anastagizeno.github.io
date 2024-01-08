#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 文件名"
    exit 1
fi
# 读取Markdown文件的路径
MARKDOWN_FILE="content/archive/$1.md"
# 查找Markdown中的图片链接，并移除image/之前的部分
sed -i "" -E 's!(\!\[.*\]\()(.*\/)/image/!\1image/!g' "$MARKDOWN_FILE"
# 输出结果
echo "Processed $MARKDOWN_FILE. Original file backed up with .bak extension."
