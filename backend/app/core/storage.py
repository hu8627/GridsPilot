import os
import json
import uuid
from typing import Dict, Any, List
from pathlib import Path
from datetime import datetime

from sqlalchemy import create_engine, Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker

# ==============================================================================
# 1. 数据库路径配置 (保持 Local-First，存放在用户主目录)
# ==============================================================================
USER_HOME = str(Path.home())
DB_DIR = os.path.join(USER_HOME, ".nexaflow", "data")
os.makedirs(DB_DIR, exist_ok=True)

DB_PATH = os.path.join(DB_DIR, "nexaflow_v2.db") # 💡 SQLite 单文件数据库
DATABASE_URL = f"sqlite:///{DB_PATH}"

# ==============================================================================
# 2. SQLAlchemy ORM 基础设置
# ==============================================================================
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==============================================================================
# 3. 核心业务表定义 (The Relational Data Models)
# ==============================================================================

class ModelRecord(Base):
    __tablename__ = "models"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False)
    api_key = Column(String(255), nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentRecord(Base):
    __tablename__ = "agents"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    desc = Column(Text, nullable=False)
    model_id = Column(String(50), nullable=False, default="gpt-4o")
    skills_json = Column(Text, default="[]") 
    is_system = Column(Boolean, default=False)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

class FlowRecord(Base):
    __tablename__ = "flows"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    nodes_json = Column(Text, default="[]")
    edges_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkspaceRecord(Base):
    __tablename__ = "workspaces"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    desc = Column(String(255), nullable=True)
    unread = Column(Integer, default=0)
    messages_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseRecord(Base):
    __tablename__ = "cases"
    id = Column(String(50), primary_key=True, index=True)
    flow_id = Column(String(50), nullable=False)
    node_id = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    human_action = Column(Text, nullable=False)
    time = Column(String(50), nullable=False)

class GenericAssetRecord(Base):
    """通用资产表 (用于 integrations, monitors, chats 等暂时无需拆解的资产)"""
    __tablename__ = "generic_assets"
    id = Column(String(100), primary_key=True)
    domain = Column(String(50), index=True, nullable=False)
    data_json = Column(Text, nullable=False)

# 启动时自动建表
Base.metadata.create_all(bind=engine)

# ==============================================================================
# 4. Repository 存储网关 (自动映射到对应的物理表)
# ==============================================================================
class FileStorage:
    """NexaFlow OS 统一的本地存储网关 (基于严格 Schema 的 SQLite 驱动)"""
    
    @staticmethod
    def _get_model_class(domain: str):
        mapping = {
            "models": ModelRecord,
            "agents": AgentRecord,
            "flows": FlowRecord,
            "workspaces": WorkspaceRecord,
            "cases": CaseRecord
        }
        return mapping.get(domain, GenericAssetRecord)

    @staticmethod
    def save(domain: str, data_dict: Dict[str, Any], record_id: str = None) -> str:
        db = SessionLocal()
        try:
            if not record_id:
                record_id = data_dict.get("id", f"{domain}_{uuid.uuid4().hex[:8]}")
                data_dict["id"] = record_id
            
            ModelClass = FileStorage._get_model_class(domain)
            record = db.query(ModelClass).filter(
                (ModelClass.id == record_id) & 
                (ModelClass.domain == domain if ModelClass == GenericAssetRecord else True)
            ).first()

            # --- 1. 兜底通用表 ---
            if ModelClass == GenericAssetRecord:
                json_str = json.dumps(data_dict, ensure_ascii=False)
                if record: record.data_json = json_str
                else: db.add(GenericAssetRecord(id=record_id, domain=domain, data_json=json_str))
            
            # --- 2. Flows (业务图纸) ---
            elif ModelClass == FlowRecord:
                nodes_str = json.dumps(data_dict.get("nodes", []), ensure_ascii=False)
                edges_str = json.dumps(data_dict.get("edges", []), ensure_ascii=False)
                if record:
                    record.name = data_dict.get("name", record.name)
                    record.description = data_dict.get("description", record.description)
                    record.nodes_json = nodes_str
                    record.edges_json = edges_str
                else:
                    db.add(FlowRecord(id=record_id, name=data_dict.get("name", "未命名"), description=data_dict.get("description"), nodes_json=nodes_str, edges_json=edges_str))

            # --- 3. Models (大模型) ---
            elif ModelClass == ModelRecord:
                if record:
                    record.name = data_dict.get("name", record.name)
                    record.provider = data_dict.get("provider", record.provider)
                    record.type = data_dict.get("type", record.type)
                    record.api_key = data_dict.get("api_key", record.api_key)
                else:
                    db.add(ModelRecord(id=record_id, name=data_dict.get("name", "未命名"), provider=data_dict.get("provider", "未知"), type=data_dict.get("type", "LLM"), api_key=data_dict.get("api_key", "")))

            # --- 4. Agents (数字员工) ---
            elif ModelClass == AgentRecord:
                skills_str = json.dumps(data_dict.get("skills", []), ensure_ascii=False)
                if record:
                    record.name = data_dict.get("name", record.name)
                    record.role = data_dict.get("role", record.role)
                    record.desc = data_dict.get("desc", record.desc)
                    record.model_id = data_dict.get("model", record.model_id)
                    record.skills_json = skills_str
                    record.is_system = data_dict.get("isSystem", record.is_system)
                    record.status = data_dict.get("status", record.status)
                else:
                    db.add(AgentRecord(id=record_id, name=data_dict.get("name", "未命名"), role=data_dict.get("role", "员工"), desc=data_dict.get("desc", ""), model_id=data_dict.get("model", "gpt-4o"), skills_json=skills_str, is_system=data_dict.get("isSystem", False), status=data_dict.get("status", "active")))

            # --- 5. Workspaces (群聊记忆) ---
            elif ModelClass == WorkspaceRecord:
                msg_str = json.dumps(data_dict.get("messages", []), ensure_ascii=False)
                if record:
                    record.name = data_dict.get("name", record.name)
                    record.desc = data_dict.get("desc", record.desc)
                    record.unread = data_dict.get("unread", record.unread)
                    record.messages_json = msg_str
                else:
                    db.add(WorkspaceRecord(id=record_id, name=data_dict.get("name", "频道"), desc=data_dict.get("desc", ""), unread=data_dict.get("unread", 0), messages_json=msg_str))

            # --- 6. Cases (纠错账本) ---
            elif ModelClass == CaseRecord:
                if record:
                    record.flow_id = data_dict.get("flow_id", record.flow_id)
                    record.node_id = data_dict.get("node_id", record.node_id)
                    record.reason = data_dict.get("reason", record.reason)
                    record.human_action = data_dict.get("human_action", record.human_action)
                    record.time = data_dict.get("time", record.time)
                else:
                    db.add(CaseRecord(id=record_id, flow_id=data_dict.get("flow_id", ""), node_id=data_dict.get("node_id", ""), reason=data_dict.get("reason", ""), human_action=data_dict.get("human_action", ""), time=data_dict.get("time", "")))
                
            db.commit()
            print(f"💾 [SQLite] 结构化资产已固化: {domain} -> {record_id}")
            return record_id
        except Exception as e:
            db.rollback()
            print(f"❌ [SQLite] 保存失败: {e}")
            raise e
        finally:
            db.close()

    @staticmethod
    def get(domain: str, record_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            ModelClass = FileStorage._get_model_class(domain)
            record = db.query(ModelClass).filter(
                (ModelClass.id == record_id) & 
                (ModelClass.domain == domain if ModelClass == GenericAssetRecord else True)
            ).first()
            
            if not record: return None

            # --- 反向组装回 Dict 供前端 API 使用 ---
            try:
                if ModelClass == GenericAssetRecord: return json.loads(record.data_json)
                elif ModelClass == FlowRecord: return {"id": record.id, "name": record.name, "description": record.description, "nodes": json.loads(record.nodes_json) if record.nodes_json else [], "edges": json.loads(record.edges_json) if record.edges_json else []}
                elif ModelClass == ModelRecord: return {"id": record.id, "name": record.name, "provider": record.provider, "type": record.type, "api_key": record.api_key}
                elif ModelClass == AgentRecord: return {"id": record.id, "name": record.name, "role": record.role, "desc": record.desc, "model": record.model_id, "skills": json.loads(record.skills_json) if record.skills_json else [], "isSystem": record.is_system, "status": record.status}
                elif ModelClass == WorkspaceRecord: return {"id": record.id, "name": record.name, "desc": record.desc, "unread": record.unread, "messages": json.loads(record.messages_json) if record.messages_json else []}
                elif ModelClass == CaseRecord: return {"id": record.id, "flow_id": record.flow_id, "node_id": record.node_id, "reason": record.reason, "human_action": record.human_action, "time": record.time}
            except Exception as e:
                print(f"⚠️ [SQLite] 记录解析失败 (ID: {record_id}): {e}")
                return None
            
            return {} 
        finally:
            db.close()

    @staticmethod
    def list_all(domain: str) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            ModelClass = FileStorage._get_model_class(domain)
            query = db.query(ModelClass)
            
            # 💡 核心防御：防止通用表跨域污染数据
            if ModelClass == GenericAssetRecord:
                query = query.filter(GenericAssetRecord.domain == domain)
            
            records = query.all()
            results = []
            
            # 批量转换与异常捕捉
            for r in records:
                try:
                    if ModelClass == GenericAssetRecord: results.append(json.loads(r.data_json))
                    elif ModelClass == FlowRecord: results.append({"id": r.id, "name": r.name, "description": r.description, "nodes": json.loads(r.nodes_json) if r.nodes_json else [], "edges": json.loads(r.edges_json) if r.edges_json else []})
                    elif ModelClass == ModelRecord: results.append({"id": r.id, "name": r.name, "provider": r.provider, "type": r.type, "api_key": r.api_key})
                    elif ModelClass == AgentRecord: results.append({"id": r.id, "name": r.name, "role": r.role, "desc": r.desc, "model": r.model_id, "skills": json.loads(r.skills_json) if r.skills_json else [], "isSystem": r.is_system, "status": r.status})
                    elif ModelClass == WorkspaceRecord: results.append({"id": r.id, "name": r.name, "desc": r.desc, "unread": r.unread, "messages": json.loads(r.messages_json) if r.messages_json else []})
                    elif ModelClass == CaseRecord: results.append({"id": r.id, "flow_id": r.flow_id, "node_id": r.node_id, "reason": r.reason, "human_action": r.human_action, "time": r.time})
                except Exception as parse_err:
                    print(f"⚠️ [SQLite] 跳过损坏的记录 {domain} -> {r.id}: {parse_err}")
                    continue
                    
            return results
        finally:
            db.close()