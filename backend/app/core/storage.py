import os
import json
import uuid
from typing import Dict, Any, List
from pathlib import Path


# 💡 核心修改：将存储目录改为用户系统主目录下的 .nexaflow 文件夹
USER_HOME = str(Path.home())
DATA_DIR = os.path.join(USER_HOME, ".nexaflow", "data")

# 核心资产目录
DIRS = {
    "chats": os.path.join(DATA_DIR, "chats"),
    "workspaces": os.path.join(DATA_DIR, "workspaces"),
    "flows": os.path.join(DATA_DIR, "flows"),
    "models": os.path.join(DATA_DIR, "models"),
    "skills": os.path.join(DATA_DIR, "skills"),
    "integrations": os.path.join(DATA_DIR, "integrations"),
    "monitors": os.path.join(DATA_DIR, "monitors"),
    "agents": os.path.join(DATA_DIR, "agents") ,
    "traces": os.path.join(DATA_DIR, "traces"),     
    "cases": os.path.join(DATA_DIR, "cases"),
    "memory": os.path.join(DATA_DIR, "memory")   
}

# 初始化时自动创建目录
for d in DIRS.values():
    os.makedirs(d, exist_ok=True)

class FileStorage:
    """NexaFlow OS 统一的本地文件存储网关 (JSON FileDB)"""
    
    @staticmethod
    def save(domain: str, data: Dict[str, Any], file_id: str = None) -> str:
        if not file_id:
            file_id = data.get("id", f"{domain}_{uuid.uuid4().hex[:8]}")
            data["id"] = file_id
            
        filepath = os.path.join(DIRS[domain], f"{file_id}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 [Storage] 资产已保存: {domain}/{file_id}.json")
        return file_id

    @staticmethod
    def get(domain: str, file_id: str) -> Dict[str, Any]:
        filepath = os.path.join(DIRS[domain], f"{file_id}.json")
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    @staticmethod
    def list_all(domain: str) -> List[Dict[str, Any]]:
        results = []
        domain_dir = DIRS[domain]
        for filename in os.listdir(domain_dir):
            if filename.endswith(".json"):
                filepath = os.path.join(domain_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    try:
                        results.append(json.load(f))
                    except:
                        continue
        return results