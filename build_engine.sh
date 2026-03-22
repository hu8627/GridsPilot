#!/bin/bash

# ============================================================================
# NexaFlow 引擎自动化构建与注入脚本 (The Engine Injector)
# 功能：一键打包 Python 后端 -> 自动识别系统芯片 -> 注入 Tauri 客户端
# ============================================================================

# 发生错误即终止
set -e

# 颜色输出函数，让终端日志更有极客感
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}🚀 启动 NexaFlow 引擎构建与注入程序...${NC}"
echo -e "${BLUE}=================================================${NC}"

# 1. 自动检测当前操作系统的目标三元组 (Tauri 需要的后缀)
echo -e "\n${YELLOW}🔍 正在探测当前系统架构...${NC}"

OS_NAME=$(uname -s)
ARCH_NAME=$(uname -m)
TAURI_TARGET=""

if [ "$OS_NAME" = "Darwin" ]; then
    if [ "$ARCH_NAME" = "arm64" ]; then
        TAURI_TARGET="aarch64-apple-darwin"
    elif [ "$ARCH_NAME" = "x86_64" ]; then
        TAURI_TARGET="x86_64-apple-darwin"
    fi
elif [ "$OS_NAME" = "Linux" ]; then
    TAURI_TARGET="x86_64-unknown-linux-gnu" # 简化处理，默认 64 位 Linux
elif [ "$OS_NAME" = "MINGW32_NT" ] || [ "$OS_NAME" = "MINGW64_NT" ]; then
    TAURI_TARGET="x86_64-pc-windows-msvc" # 简化处理 Windows
else
    echo -e "${RED}❌ 无法识别的操作系统架构: $OS_NAME $ARCH_NAME${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 识别到目标架构: ${TAURI_TARGET}${NC}"

# 2. 进入 backend 目录并执行 PyInstaller 打包
echo -e "\n${YELLOW}📦 正在使用 PyInstaller 编译 Python 后端 (这可能需要 1-3 分钟)...${NC}"
cd backend

# 如果你用了虚拟环境，确保虚拟环境中的 pyinstaller 可用。
# 这里假设你已经在当前终端激活了 (.venv)
if ! command -v pyinstaller &> /dev/null; then
    echo -e "${RED}❌ 未找到 PyInstaller，请确保已在虚拟环境中执行 pip install pyinstaller${NC}"
    exit 1
fi

# 执行打包命令，强制覆盖 (-y)，单文件 (--onefile)
pyinstaller -y --onefile run.py -n nexaflow-engine

echo -e "${GREEN}✓ 后端引擎编译完成！${NC}"
cd ..

# 3. 将新引擎移植到 Tauri 前端并赋予执行权限
echo -e "\n${YELLOW}💉 正在将新引擎注入 Tauri 客户端目录...${NC}"

# 确保前端 bin 目录存在
mkdir -p frontend/src-tauri/bin

# 构造源文件路径和目标文件路径
if [ "$OS_NAME" = "MINGW32_NT" ] || [ "$OS_NAME" = "MINGW64_NT" ]; then
    SRC_FILE="backend/dist/nexaflow-engine.exe"
    DEST_FILE="frontend/src-tauri/bin/nexaflow-engine-${TAURI_TARGET}.exe"
else
    SRC_FILE="backend/dist/nexaflow-engine"
    DEST_FILE="frontend/src-tauri/bin/nexaflow-engine-${TAURI_TARGET}"
fi

if [ ! -f "$SRC_FILE" ]; then
    echo -e "${RED}❌ 致命错误：在 backend/dist/ 中找不到编译好的引擎文件！${NC}"
    exit 1
fi

# 执行拷贝和重命名
cp "$SRC_FILE" "$DEST_FILE"

# 赋予执行权限 (Mac/Linux 专属)
if [ "$OS_NAME" != "MINGW32_NT" ] && [ "$OS_NAME" != "MINGW64_NT" ]; then
    chmod +x "$DEST_FILE"
    echo -e "${GREEN}✓ 已赋予执行权限 (chmod +x)${NC}"
fi

echo -e "${GREEN}✓ 引擎已成功注入: $DEST_FILE${NC}"

# 4. 清理编译垃圾 (可选，保持目录整洁)
echo -e "\n${YELLOW}🧹 正在清理构建过程产生的垃圾文件...${NC}"
rm -rf backend/build/
rm -rf backend/nexaflow-engine.spec

echo -e "\n${BLUE}=================================================${NC}"
echo -e "${GREEN}🎉 恭喜！NexaFlow 引擎已成功编译并完成注入！${NC}"
echo -e "${BLUE}👉 下一步: 请在 frontend 目录下运行 'npm run tauri dev' 启动桌面端。${NC}"
echo -e "${BLUE}=================================================${NC}\n"