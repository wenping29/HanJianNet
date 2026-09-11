#!/usr/bin/env python3
"""Import hanjian data from shi folder CSVs - generate SQL file for MySQL."""

import csv
import os
import uuid
import re
import json
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "shi")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sql", "shi-import.sql")

SKIP_FILES = {"表格_20260827.csv"}


def gen_id():
    return uuid.uuid4().hex


def now_str():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")


def escape_sql(s):
    if s is None:
        return "NULL"
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


# 现代 23 省 + 4 直市 + 5 自治区 + 2 特区（与 webapi/Common/ProvinceMatcher 一致）
_PROVINCES = [
    "北京", "天津", "上海", "重庆",
    "河北", "山西", "辽宁", "吉林", "黑龙江",
    "江苏", "浙江", "安徽", "福建", "江西", "山东",
    "河南", "湖北", "湖南", "广东", "海南",
    "四川", "贵州", "云南", "陕西", "甘肃", "青海",
    "内蒙古", "广西", "西藏", "宁夏", "新疆",
    "台湾", "香港", "澳门",
]

# 历史省名 → 现代省名
_HISTORICAL_MAP = {
    "直隶": "河北", "奉天": "辽宁", "热河": "河北", "察哈尔": "河北",
    "绥远": "内蒙古", "西康": "四川", "安东": "辽宁", "辽北": "辽宁",
    "松江": "黑龙江", "合江": "黑龙江", "嫩江": "黑龙江", "兴安": "内蒙古",
    "满洲": "黑龙江", "新京": "吉林",
}

# 按长度降序，优先匹配 3 字名称
_ALL_PREFIXES = sorted(_PROVINCES + list(_HISTORICAL_MAP.keys()), key=len, reverse=True)


def match_province(text):
    """从籍贯字符串中提取省份（支持历史省名映射），无法识别返回空串。"""
    if not text:
        return ""
    for prefix in _ALL_PREFIXES:
        if prefix in text:
            return _HISTORICAL_MAP.get(prefix, prefix)
    return ""



def extract_aliases(name):
    aliases = []
    m = re.search(r"[\(（]([^)）]+)[\)）]", name)
    if m:
        alias_str = m.group(1)
        skip_words = ("佚名", "不详", "佚名，维持会头目", "绰号")
        if not any(w in alias_str for w in skip_words):
            aliases.append(alias_str)
    clean_name = re.sub(r"[\(（][^)）]*[\)）]", "", name).strip()
    return clean_name, aliases


def extract_native_place(val):
    val = val.strip()
    if val in ("不详", "佚名", "）", ""):
        return ""
    return val


def detect_columns(header):
    mapping = {}
    h = [c.strip().replace("\ufeff", "") for c in header]

    for i, col in enumerate(h):
        if col in ("姓名", "姓名 ") or "姓名" in col:
            mapping["name"] = i
        elif "籍贯" in col or "所属地区" in col:
            mapping["native_place"] = i
        elif "伪职" in col or "身份" in col:
            mapping["role_title"] = i
        elif "罪行" in col or "核心罪行" in col:
            mapping["crime"] = i
        elif "结局" in col or "最终结局" in col:
            mapping["ending"] = i
        elif col in ("区域", "活动地区", "县份"):
            mapping["region"] = i
        elif "备注" in col or "来源" in col:
            mapping["source"] = i
        elif col == "序号":
            mapping["seq"] = i

    return mapping


def parse_row(row, mapping):
    name_raw = row[mapping["name"]].strip() if "name" in mapping else ""
    if not name_raw or name_raw in ("姓名", ""):
        return None

    clean_name, aliases = extract_aliases(name_raw)

    native_place = ""
    if "native_place" in mapping:
        native_place = extract_native_place(row[mapping["native_place"]])
    elif "region" in mapping:
        native_place = extract_native_place(row[mapping["region"]])

    role_title = row[mapping["role_title"]].strip() if "role_title" in mapping else ""
    crime = row[mapping["crime"]].strip() if "crime" in mapping else ""
    ending = row[mapping["ending"]].strip() if "ending" in mapping else ""

    summary_parts = []
    if role_title:
        summary_parts.append(f"伪职：{role_title}")
    if crime:
        summary_parts.append(f"罪行：{crime}")
    if ending:
        summary_parts.append(f"结局：{ending}")
    summary = "；".join(summary_parts)

    if "source" in mapping:
        source = row[mapping["source"]].strip()
        if source:
            summary += f"（来源：{source}）"

    identity_tags = []
    if role_title:
        identity_tags.append(role_title)

    return {
        "id": gen_id(),
        "name": clean_name,
        "native_place": native_place,
        "province": match_province(native_place),
        "aliases": aliases,
        "identity_tags": identity_tags,
        "period": "抗日战争时期",
        "summary": summary,
    }


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


def process_file(filepath):
    filename = os.path.basename(filepath)
    if filename in SKIP_FILES:
        return [], 0

    try:
        with open(filepath, "r", encoding="utf-8-sig") as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        try:
            with open(filepath, "r", encoding="gbk") as f:
                lines = f.readlines()
        except Exception:
            return [], 0

    if not lines:
        return [], 0

    header_idx = None
    for i, line in enumerate(lines):
        if "姓名" in line:
            header_idx = i
            break

    if header_idx is None:
        return [], 0

    header = lines[header_idx].strip().split(",")
    mapping = detect_columns(header)

    if "name" not in mapping:
        return [], 0

    stmts = []
    count = 0
    for line in lines[header_idx + 1:]:
        line = line.strip()
        if not line:
            continue
        parts = line.split(",")
        if len(parts) < 2:
            continue

        t = parse_row(parts, mapping)
        if t and t["name"]:
            stmts.append(gen_insert_sql(t))
            count += 1

    return stmts, count


def main():
    csv_files = sorted(
        f for f in os.listdir(DATA_DIR) if f.endswith(".csv") and f not in SKIP_FILES
    )
    print(f"Found {len(csv_files)} CSV files to process.")

    all_stmts = []
    total = 0

    for fname in csv_files:
        fpath = os.path.join(DATA_DIR, fname)
        stmts, n = process_file(fpath)
        if n > 0:
            print(f"  {fname}: {n} records")
            all_stmts.append(f"-- {fname} ({n} records)")
            all_stmts.extend(stmts)
        total += n

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- ============================================\n")
        f.write("-- HanJianNet · shi 目录汉奸数据导入脚本\n")
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
