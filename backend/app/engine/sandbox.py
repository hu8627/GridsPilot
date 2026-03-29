# backend/app/execution/sandbox.py
import asyncio
import uuid
import os
import json
from typing import Dict, Any

class SandboxExecutor:
    """
    GridsPilot 终极防线：Docker 沙箱代码执行器
    确保任何由前端或大模型动态生成的 Skill 代码，都在极其受限的、阅后即焚的物理容器中运行。
    """
    def __init__(self, image: str = "python:3.10-alpine"):
        self.image = image
        # 在真实生产环境中，这里应该使用 docker-py SDK
        # 但为了保持我们目前的轻量化 POC (不需要你本地强制装 docker 库)，
        # 我们用 asyncio.create_subprocess_shell 来调用本机的 docker 命令行模拟！

    async def execute_python_code(self, code_string: str, params: Dict[str, Any], timeout_seconds: int = 10) -> Dict[str, Any]:
        """
        将危险的代码和入参，塞进 Docker 黑屋里执行。
        """
        # 1. 生成一个独一无二的容器 ID，防止并发冲突
        container_id = f"grids_sandbox_{uuid.uuid4().hex[:8]}"
        
        # 2. 将前端传来的参数 (Params) 序列化，准备注给沙箱
        params_json = json.dumps(params, ensure_ascii=False)
        
        # 3. 极其巧妙的“套壳脚本 (Wrapper Script)”
        # 我们把用户写的脏代码嵌在一个标准的 Try-Catch 框架里，并把结果通过 print(json) 的方式吐出来
        wrapper_script = f"""
import sys
import json
import traceback

def user_function(params):
    # ================= 用户代码注入区 =================
{self._indent_code(code_string)}
    # ==================================================

if __name__ == "__main__":
    try:
        input_params = json.loads('''{params_json}''')
        # 执行危险代码
        result = user_function(input_params)
        
        # 强制格式化输出
        print("---GRIDS_SANDBOX_START---")
        print(json.dumps({{"status": "success", "data": result}}, ensure_ascii=False))
        print("---GRIDS_SANDBOX_END---")
        sys.exit(0)
    except Exception as e:
        err_msg = traceback.format_exc()
        print("---GRIDS_SANDBOX_START---")
        print(json.dumps({{"status": "error", "message": str(e), "traceback": err_msg}}, ensure_ascii=False))
        print("---GRIDS_SANDBOX_END---")
        sys.exit(1)
"""
        
        # 4. 将这段包装好的代码存为临时物理文件 (宿主机)
        tmp_dir = os.path.join("/tmp", "gridspilot_sandbox")
        os.makedirs(tmp_dir, exist_ok=True)
        script_path = os.path.join(tmp_dir, f"{container_id}.py")
        
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(wrapper_script)

        print(f"🛡️ [Sandbox] 已生成危险代码载荷，准备投放至隔离容器: {container_id}")

        # 5. 拼装极其冷酷的 Docker 执行命令
        # - --rm: 跑完立刻自动销毁容器，绝不留垃圾
        # - --network none: (可选) 如果你不想让这段代码上网，就加上这句，彻底物理断网！
        # - --memory 64m --cpus 0.5: 严防死守，哪怕它写了死循环，也只能占用 0.5核和 64M内存！
        docker_cmd = f"""
        docker run --rm \
        --name {container_id} \
        --memory 128m \
        --cpus 0.5 \
        -v {script_path}:/app/script.py \
        -w /app \
        {self.image} python script.py
        """

        try:
            # 6. 异步拉起容器，并挂上“死神定时器 (Timeout)”
            process = await asyncio.create_subprocess_shell(
                docker_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # 使用 wait_for 限制最大存活时间
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout_seconds)
            
            out_str = stdout.decode()
            err_str = stderr.decode()

            # 7. 从容器的乱七八糟的输出中，精准提取我们包装好的 JSON
            return self._extract_result(out_str, err_str)
            
        except asyncio.TimeoutError:
            # 🚨 触发物理绞杀！如果代码跑了 10 秒还不出来（比如死循环），直接在外网把容器杀掉！
            print(f"💀 [Sandbox] 容器 {container_id} 超时！触发物理绞杀指令...")
            await self._kill_container(container_id)
            return {"status": "error", "message": f"执行超时 ({timeout_seconds}s)，容器已被强制销毁。"}
        finally:
            # 无论如何，把宿主机的临时文件删掉
            if os.path.exists(script_path):
                os.remove(script_path)

    def _indent_code(self, code: str) -> str:
        """辅助函数：将用户代码整体缩进 4 格，塞进包装函数里"""
        return "\n".join([f"    {line}" for line in code.split("\n")])

    def _extract_result(self, stdout: str, stderr: str) -> dict:
        """从 Docker 终端标准输出中提取结构化数据"""
        try:
            # 寻找安全标记
            if "---GRIDS_SANDBOX_START---" in stdout and "---GRIDS_SANDBOX_END---" in stdout:
                json_part = stdout.split("---GRIDS_SANDBOX_START---")[1].split("---GRIDS_SANDBOX_END---")[0].strip()
                return json.loads(json_part)
            else:
                return {"status": "error", "message": "容器异常退出，未捕获到合法返回值。", "raw_stdout": stdout, "raw_stderr": stderr}
        except Exception as e:
            return {"status": "error", "message": f"解析沙箱产物失败: {e}"}

    async def _kill_container(self, container_id: str):
        """极其暴力的物理销毁指令"""
        kill_cmd = f"docker kill {container_id}"
        proc = await asyncio.create_subprocess_shell(kill_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()