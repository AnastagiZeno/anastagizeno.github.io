#!/usr/bin/env bash
set -euo pipefail

# -------- utils --------
function die() { echo "[ERR] $*" >&2; exit 1; }
function has() { command -v "$1" >/dev/null 2>&1; }

# 仅当有变更时才提交，避免 "nothing to commit" 导致中断
function safe_git_commit_push() {
    local msg="${1:-tick-tock}"
    git status -s >/dev/null 2>&1 || die "当前目录不是 git 仓库？"

    # 暂存所有变化（包括删除）
    git add -A

    if ! git diff --cached --quiet; then
        git commit -m "$msg"
        git push
    else
        echo "[git] no staged changes, skip commit"
    fi
}

# 打开目标文件到 Sublime（优先 subl，没有则用 macOS open）
function open_in_sublime() {
    local file="$1"
    if has subl; then
        subl "$file"
    elif has open; then
        open -a "Sublime Text" "$file" || echo "[warn] 'open -a Sublime Text' 失败，请检查 Sublime 是否安装"
    else
        echo "[warn] 找不到 'subl' 或 'open'，已生成文件：$file"
    fi
}

# 等待文件出现（默认最多等 5 秒）
function wait_for_file() {
    local file="$1"
    local tries="${2:-10}"     # 10 次，每次 0.5s
    local interval="${3:-0.5}" # 间隔 0.5s
    for _ in $(seq 1 "$tries"); do
        [[ -f "$file" ]] && return 0
        sleep "$interval"
    done
    return 1
}

# -------- features --------
function new_post() {
    has hugo || die "未检测到 hugo，请先安装： https://gohugo.io/getting-started/installing/"

    local name="${1:-}"
    if [[ -z "$name" ]]; then
        name="$(date +%Y%m%d)"
    fi

    # 去掉可能重复的 .md 后缀
    name="${name%.md}"
    local rel="content/archive/${name}.md"

    # 生成
    echo "[hugo] create: $rel"
    hugo new "$rel"  # hugo 会输出最终路径

    # 最多等待 5 秒直到文件出现
    if wait_for_file "$rel" 10 0.5; then
        echo "[ok] file ready: $rel"
        open_in_sublime "$rel"
    else
        echo "[warn] 生成后未发现文件：$rel"
    fi
}

function deploy() {
    has hugo || die "未检测到 hugo，请先安装： https://gohugo.io/getting-started/installing/"
    echo "[hugo] building..."
    # 一次构建足够；如需三连可保留
    hugo --gc --cleanDestinationDir --minify -d public
    echo "[hugo] build done -> public/"
}

function launch() {
    echo -e "\n[launch] push root repo\n"
    git status
    sleep 0.8
    safe_git_commit_push "tick-tock"

    if [[ -d public/.git ]]; then
        echo -e "\n[launch] push public/ repo\n"
        pushd public >/dev/null
        git status
        sleep 0.8
        safe_git_commit_push "tick-tock"
        popd >/dev/null
    else
        echo "[warn] public/ 不是 git 仓库，跳过 public 推送"
    fi

    echo "[launch] done, bye"
}

function usage() {
    cat <<'EOF'
Usage: ./cmd.sh [-n[post-name]] [-d] [-l] [-x] [-h]

Options:
  -n[post-name]  新建一篇文章到 content/archive/ 下，并自动用 Sublime 打开。
                  -n          -> 使用当天日期作为文件名 (YYYYMMDD.md)
                  -nname      -> 使用 name.md （注意：可选参数需要紧贴 -n）
                  -n"My Post" -> 支持空格的名称
  -d             本地构建（hugo -> public/）
  -l             推送当前仓库与 public/ 仓库
  -x             先构建再推送（等价于 -d 后接 -l）
  -h             查看帮助

Note:
  1) 若 'subl' 命令不可用，会尝试 'open -a "Sublime Text"'（适用于 macOS）。
  2) Git 提交仅在有变更时执行；无改动自动跳过。
  3) -n 的“可选参数”语法要求 -n 与值紧贴：如 -nname 或 -n"name with space"。
EOF
}

# -------- entry --------
if [[ $# -eq 0 ]]; then
    usage; exit 1
fi

# -n 的参数做成“可选”（双冒号）
while getopts ":n::ldxh" opt; do
    case "${opt}" in
        n) new_post "${OPTARG:-}";;
        d) deploy;;
        l) launch;;
        x) deploy; sleep 1; launch;;
        h) usage; exit 0;;
        \?) echo "Invalid option: -${OPTARG}" >&2; usage; exit 1;;
        :)  echo "Option -${OPTARG} requires an argument." >&2; usage; exit 1;;
    esac
done
shift $((OPTIND - 1))
