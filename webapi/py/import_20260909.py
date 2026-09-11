#!/usr/bin/env python3
"""Import hanjian data from 20260909 folder - generate MySQL INSERT statements.

Handles two families of source files:
  1. The four "标准" CSVs: 姓名,籍贯,身份,主要史实,史料来源,备注
  2. deepseek_csv_*.txt: quoted CSV with headers like
     "地区","姓名","职务","主要罪行","结局"  or
     "类别","地区[或地区/籍贯]","姓名","职务/身份","主要罪行","结局"

Output maps into the existing `Traitors` MySQL table (see sql/DDL_hanjian.sql).
"""

import csv
import io
import json
import os
import re
import uuid
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "20260909")
OUTPUT_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "sql", "20260909-import.sql"
)


def gen_id():
    return uuid.uuid4().hex


def now_str():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")


def escape_sql(s):
    if s is None:
        return "NULL"
    s = str(s)
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def gen_insert_sql(t):
    now = now_str()
    return (
        f"INSERT INTO `Traitors` "
        f"(`Id`,`Name`,`CourtesyName`,`Pseudonym`,`BirthYear`,`DeathYear`,"
        f"`BirthYearType`,`DeathYearType`,`NativePlace`,`Province`,`AliasesJson`,"
        f"`IdentityTagsJson`,`Period`,`Faction`,`Summary`,`RelatedIdsJson`,"
        f"`CreatedAt`,`UpdatedAt`) VALUES ("
        f"{escape_sql(t['id'])},"
        f"{escape_sql(t['name'])},"
        f"NULL,NULL,NULL,NULL,"
        f"'exact','exact',"
        f"{escape_sql(t['native_place'])},"
        f"{escape_sql(t['province'])},"
        f"{escape_sql(json.dumps(t['aliases'], ensure_ascii=False))},"
        f"{escape_sql(json.dumps(t['identity_tags'], ensure_ascii=False))},"
        f"{escape_sql(t['period'])},"
        f"'',"
        f"{escape_sql(t['summary'])},"
        f"'[]',"
        f"'{now}','{now}');"
    )


# ---------------------------------------------------------------------------
# A) 标准 CSV 处理（姓名,籍贯,身份,主要史实,史料来源,备注）
# ---------------------------------------------------------------------------

def process_standard_csv(rows):
    """rows: list of dicts with keys name/native_place/role/summary/source/remark."""
    out = []
    for r in rows:
        name_raw = r.get("name", "")
        if not name_raw:
            continue
        clean_name, aliases = extract_aliases(name_raw)
        if not clean_name:
            clean_name = "佚名"

        native_place = r.get("native_place", "").strip()
        if native_place in ("不详", "佚名", "）", ""):
            native_place = ""

        role = r.get("role", "").strip()
        summary_text = r.get("summary", "").strip()
        source = r.get("source", "").strip()
        remark = r.get("remark", "").strip()

        summary_parts = []
        if role:
            summary_parts.append(f"伪职：{role}")
        if summary_text:
            summary_parts.append(f"罪行：{summary_text}")
        if source:
            summary_parts.append(f"来源：{source}")
        if remark:
            summary_parts.append(f"备注：{remark}")
        summary = "；".join(summary_parts)

        identity_tags = [role] if role else []

        province = match_province(native_place)
        if not province:
            province = match_province(role + summary_text)

        out.append({
            "id": gen_id(),
            "name": clean_name,
            "native_place": native_place,
            "province": province,
            "aliases": aliases,
            "identity_tags": identity_tags,
            "period": "抗日战争时期",
            "summary": summary,
        })
    return out


def read_standard_csv(filepath):
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append({
                "name": (row.get("姓名") or "").strip(),
                "native_place": (row.get("籍贯") or "").strip(),
                "role": (row.get("身份") or "").strip(),
                "summary": (row.get("主要史实") or "").strip(),
                "source": (row.get("史料来源") or "").strip(),
                "remark": (row.get("备注") or "").strip(),
            })
    return rows


# ---------------------------------------------------------------------------
# B) deepseek txt 处理（带引号的 CSV，列名可能变化）
# ---------------------------------------------------------------------------

_REFS = re.compile(r"\[reference:\d+\]")


def clean_refs(s):
    return _REFS.sub("", s).strip()


def process_deepseek_rows(rows):
    """rows: list of dicts with keys region/name/role/crime/ending/category."""
    out = []
    for r in rows:
        name_raw = (r.get("name") or "").strip()
        if not name_raw:
            continue
        if name_raw in ("姓名", "职务"):
            continue
        clean_name, aliases = extract_aliases(name_raw)
        if not clean_name:
            clean_name = "佚名"

        region = (r.get("region") or "").strip()
        native_place = ""
        for prefix in ("（今属", "（今", "县", "市", "区", "镇"):
            if prefix in region:
                native_place = region
                break
        if not native_place and region and not region.startswith("地区"):
            native_place = region

        role = clean_refs((r.get("role") or "").strip())
        crime = clean_refs((r.get("crime") or "").strip())
        ending = clean_refs((r.get("ending") or "").strip())

        province = match_province(native_place)
        if not province:
            province = match_province(role + crime + ending)

        summary_parts = []
        if role:
            summary_parts.append(f"伪职：{role}")
        if crime:
            summary_parts.append(f"罪行：{crime}")
        if ending and ending != "待考":
            summary_parts.append(f"结局：{ending}")
        summary = "；".join(summary_parts)

        identity_tags = [role] if role else []

        out.append({
            "id": gen_id(),
            "name": clean_name,
            "native_place": native_place,
            "province": province,
            "aliases": aliases,
            "identity_tags": identity_tags,
            "period": "抗日战争时期",
            "summary": summary,
        })
    return out


def read_deepseek_txt(filepath):
    with open(filepath, "r", encoding="utf-8-sig") as f:
        text = f.read()
    # Both header variants seen in the txt files
    dialect = csv.Sniffer().sniff(text, delimiters=",")
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)

    # Normalize header keys
    idx_map = {}
    for i, h in enumerate(reader.fieldnames or []):
        hh = h.strip().strip('"').strip()
        if "姓名" in hh:
            idx_map["name"] = i
        elif "地区" in hh or "籍贯" in hh:
            idx_map["region"] = i
        elif "职务" in hh or "身份" in hh:
            idx_map["role"] = i
        elif "罪行" in hh:
            idx_map["crime"] = i
        elif "结局" in hh:
            idx_map["ending"] = i
        elif "类别" in hh:
            idx_map["category"] = i

    fieldnames = [h.strip().strip('"').strip() for h in reader.fieldnames or []]
    if "region" not in idx_map:
        return []

    rows = []
    for row in reader:
        vals = list(row.values())
        rows.append({
            "region": vals[idx_map["region"]] if "region" in idx_map else "",
            "name": vals[idx_map["name"]] if "name" in idx_map else "",
            "role": vals[idx_map["role"]] if "role" in idx_map else "",
            "crime": vals[idx_map["crime"]] if "crime" in idx_map else "",
            "ending": vals[idx_map["ending"]] if "ending" in idx_map else "",
            "category": vals[idx_map["category"]] if "category" in idx_map else "",
        })
    return rows


# ---------------------------------------------------------------------------
# 通用：别名提取 / 省份匹配（复用 import_shi.py 逻辑）
# ---------------------------------------------------------------------------

def extract_aliases(name):
    aliases = []
    m = re.search(r"[\(（]([^)）]+)[\)）]", name)
    if m:
        alias_str = m.group(1)
        skip_words = ("佚名", "不详", "佚名，维持会头目", "绰号", "汉奸", "外号")
        if not any(w in alias_str for w in skip_words):
            parts = [p.strip() for p in re.split(r"[、/]", alias_str) if p.strip()]
            aliases.extend(parts)
    clean_name = re.sub(r"[\(（][^)）]*[\)）]", "", name).strip()
    return clean_name, aliases


_PROVINCES = [
    "北京", "天津", "上海", "重庆",
    "河北", "山西", "辽宁", "吉林", "黑龙江",
    "江苏", "浙江", "安徽", "福建", "江西", "山东",
    "河南", "湖北", "湖南", "广东", "海南",
    "四川", "贵州", "云南", "陕西", "甘肃", "青海",
    "内蒙古", "广西", "西藏", "宁夏", "新疆",
    "台湾", "香港", "澳门",
]
_HISTORICAL_MAP = {
    "直隶": "河北", "奉天": "辽宁", "热河": "河北", "察哈尔": "河北",
    "绥远": "内蒙古", "西康": "四川", "安东": "辽宁", "辽北": "辽宁",
    "松江": "黑龙江", "合江": "黑龙江", "嫩江": "黑龙江", "兴安": "内蒙古",
    "满洲": "黑龙江", "新京": "吉林",
}
_ALL_PREFIXES = sorted(_PROVINCES + list(_HISTORICAL_MAP.keys()), key=len, reverse=True)


def match_province(text):
    if not text:
        return ""
    for prefix in _ALL_PREFIXES:
        if prefix in text:
            return _HISTORICAL_MAP.get(prefix, prefix)
    return ""


# ---------------------------------------------------------------------------

def main():
    std_files = [
        "江西省汉奸名录（赣中南东七市）.csv",
        "山东省汉奸名录（16市）.csv",
        "jinan.csv",
        "qingdao.csv",
    ]
    all_stmts = []
    total = 0

    # 标准 CSV 文件
    for fname in std_files:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            continue
        rows = read_standard_csv(fpath)
        records = process_standard_csv(rows)
        n = len(records)
        if n > 0:
            print(f"  {fname}: {n} records")
            all_stmts.append(f"-- {fname} ({n} records)")
            for t in records:
                all_stmts.append(gen_insert_sql(t))
            total += n

    # deepseek txt 文件
    deepseek_files = sorted(
        f for f in os.listdir(DATA_DIR)
        if f.endswith(".txt") and f.startswith("deepseek_csv_")
    )
    for fname in deepseek_files:
        fpath = os.path.join(DATA_DIR, fname)
        try:
            rows = read_deepseek_txt(fpath)
        except Exception as e:
            print(f"  [SKIP] {fname}: {e}")
            continue
        records = process_deepseek_rows(rows)
        n = len(records)
        if n > 0:
            print(f"  {fname}: {n} records")
            all_stmts.append(f"-- {fname} ({n} records)")
            for t in records:
                all_stmts.append(gen_insert_sql(t))
            total += n

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- HanJianNet · 20260909 目录汉奸数据导入脚本\n")
        f.write(f"-- 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"-- 总记录数: {total}\n")
        f.write("-- ============================================\n\n")
        f.write("SET NAMES utf8mb4;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
        f.write("\n".join(all_stmts))
        f.write("\n\nSET FOREIGN_KEY_CHECKS = 1;\n")

    print(f"\nDone. Total: {total} records.")
    print(f"SQL file: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
