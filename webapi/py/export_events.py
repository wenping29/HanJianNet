#!/usr/bin/env python3
"""Export all historical events (惨案 + 宏观历史事件 + 恶性事件推导) to SQL.

Sources:
  1. 根目录 惨案事件汇总.csv   --- 39 条具体惨案 + 涉案人员
  2. web/src/lib/historyEvents.ts --- 9 条宏观历史事件(崖山之战/甲申国难/扬州十日/嘉定三屠/
     吴三桂弑永历/九一八事变/七七事变/淞沪会战/南京大屠杀)
  3. 根目录 恶性事件.csv      --- 推导新增的具体暴行事件及关联人员

Outputs:
  webapi/sql/atrocityevents.mysql.sql    (MySQL 8)
  webapi/sql/atrocityevents.sqlite.sql   (SQLite)
"""

import csv
import os
import re
import json
import uuid
import textwrap
from datetime import datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
CSV_ATROCITY = os.path.join(ROOT, "惨案事件汇总.csv")
CSV_CRIMES = os.path.join(ROOT, "恶性事件.csv")
SQL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sql")
OUT_MYSQL = os.path.join(SQL_DIR, "atrocityevents.mysql.sql")
OUT_SQLITE = os.path.join(SQL_DIR, "atrocityevents.sqlite.sql")


def gen_id(seed=None):
    if seed is None:
        return uuid.uuid4().hex
    return uuid.uuid5(uuid.NAMESPACE_DNS, seed).hex


def now_str():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")


# ---------------------------------------------------------------------------
# 1) 惨案事件汇总.csv -> 事件 + 人员
# ---------------------------------------------------------------------------

def parse_atrocity_csv():
    events = []
    persons = []
    with open(CSV_ATROCITY, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("惨案名称") or "").strip()
            if not name:
                continue
            location = (row.get("发生地点") or "").strip()
            province, city = split_location(location)
            person_count = int((row.get("涉案人数") or "0").strip() or 0)
            is_general = 1 if name.startswith("（通用描述）") else 0
            summary = (row.get("典型罪行摘要") or "").strip()
            evt_id = gen_id(f"atrocity:{name}")

            events.append({
                "Id": evt_id,
                "Name": name,
                "Alias": "",
                "EventType": "惨案",
                "Era": "",
                "Year": "",
                "Province": province,
                "City": city,
                "Location": location,
                "IsGeneral": is_general,
                "PersonCount": person_count,
                "Summary": summary,
                "Keywords": "[]",
            })

            # 人员
            names_raw = (row.get("涉案人员") or "").strip()
            details_raw = (row.get("涉案人员详情") or "").strip()
            name_list = [n.strip() for n in re.split(r"[、,，]", names_raw) if n.strip()]
            sort = 0
            for pname in name_list:
                sort += 1
                loc, identity = split_person_detail(pname, details_raw)
                persons.append({
                    "Id": gen_id(f"person:{evt_id}:{pname}"),
                    "AtrocityCaseId": evt_id,
                    "Name": pname,
                    "Location": loc,
                    "IdentityTags": identity,
                    "Sort": sort,
                })
    return events, persons


def split_location(location):
    if not location:
        return "", ""
    parts = location.split()
    if len(parts) >= 2:
        return parts[0], parts[1]
    return parts[0], ""


def split_person_detail(name, details_raw):
    """从详情中提取该人员的 地点(括号) 与 身份描述。"""
    start = details_raw.find(name)
    if start < 0:
        return "", ""
    # 定位该段结尾：下一个已知人名（按"。"、"；"后的汉字人名）切割
    segment = details_raw[start:]
    # 去除以该姓名开头的杂质
    m = re.match(r"^%s\s*(?:[（(]([^)）]*)[)）])?\s*[-－—]?\s*(.*)$" % re.escape(name), segment, re.S)
    if not m:
        return "", ""
    loc = (m.group(1) or "").strip()
    desc = m.group(2)
    # 截断到下一个"名字 -"变化（保守起见取到下一个"。姓名"前）
    desc = re.split(r"(?:。|；)(?=[\u4e00-\u9fa5]{1,6}\s*[（(]?[\u4e00-\u9fa5]{1,10}[）)]?\s*[-－—])", desc)[0]
    desc = desc.strip().strip("。；；,，").strip()
    return loc, desc


# ---------------------------------------------------------------------------
# 2) historyEvents.ts 中的宏观历史事件
# ---------------------------------------------------------------------------

HISTORY_EVENTS = [
    {"id": "yashan", "year": 1279, "era": "宋末", "title": "崖山之战", "alias": "张世杰灭宋崖山之战",
     "desc": "南宋祥兴二年，元将张弘范率水师围攻崖山。宋将张世杰力战二十余日，终因寡不敌众，水师全歼。丞相陆秀夫负少帝赵昺投海殉国，随行军民十余万赴死，宋祚断绝——华夏全境首次沦于异族之手。",
     "keywords": ["崖山", "张世杰", "陆秀夫", "张弘范"], "location": "广东 江门", "type": "战役"},
    {"id": "jiashen", "year": 1644, "era": "明末", "title": "甲申国难", "alias": "",
     "desc": "明崇祯十七年甲申，李自成率大顺军攻陷北京，崇祯帝自缢于煤山，明廷倾覆。旋即辽东总兵吴三桂开关迎敌，引清军入关击败大顺军，神州易主，入关清军随即推行剃发易服之令。",
     "keywords": ["甲申", "李自成", "崇祯", "吴三桂"], "location": "北京", "type": "国难"},
    {"id": "yangzhou", "year": 1645, "era": "明末", "title": "扬州十日", "alias": "",
     "desc": "清豫亲王多铎挥师南下克扬州，史可法死节。城破后清军屠城十日，据《扬州十日记》所载，死者逾八十万，尸骨山积，血流成渠。",
     "keywords": ["扬州", "史可法"], "location": "江苏 扬州", "type": "大屠杀"},
    {"id": "jiading", "year": 1645, "era": "明末", "title": "嘉定三屠", "alias": "",
     "desc": "清廷强颁剃发令，嘉定军民三次起兵抗清，朱瑛、侯峒曾、吴之藩等先后举义。清军三次破城屠戮，死难者无算，是为\"嘉定三屠\"。",
     "keywords": ["嘉定"], "location": "上海 嘉定", "type": "大屠杀"},
    {"id": "wusangui-yongli", "year": 1662, "era": "明末", "title": "吴三桂弑永历", "alias": "吴三桂杀南明皇帝",
     "desc": "明末降将吴三桂率清兵入缅，执南明永历帝朱由榔，绞杀于昆明篦子坡。南明覆亡，明祚尽绝，汉奸之祸延及亡国之君。",
     "keywords": ["永历", "吴三桂", "昆明"], "location": "云南 昆明", "type": "国难"},
    {"id": "918", "year": 1931, "era": "抗日战争时期", "title": "九一八事变", "alias": "918事变",
     "desc": "日军关东军自炸南满铁路柳条湖段，反诬中国军队所为，藉机炮轰沈阳北大营。东北军奉不抵抗之令撤入关内，未及数月，东北三省百万平方公里国土沦陷敌手。",
     "keywords": ["九一八", "柳条湖", "沈阳"], "location": "辽宁 沈阳", "type": "事变"},
    {"id": "77", "year": 1937, "era": "抗日战争时期", "title": "七七事变", "alias": "",
     "desc": "日军在卢沟桥附近进行所谓\"夜间演习\"，借口一名士兵失踪，向中国守军第二十九军发动进攻。中国军队奋起还击，全面抗战由此爆发，中华民族进入八年浴血之岁月。",
     "keywords": ["七七", "卢沟桥"], "location": "北京 丰台", "type": "事变"},
    {"id": "songhu", "year": 1937, "era": "抗日战争时期", "title": "淞沪会战", "alias": "淞沪抗战",
     "desc": "日军大举进攻上海，中国军队倾精锐之师血战淞沪三月，粉碎其\"三月亡华\"之妄想。此役中国军人伤亡逾三十万，为抗战初期规模最大、最为惨烈之会战。",
     "keywords": ["淞沪", "上海"], "location": "上海", "type": "战役"},
    {"id": "nanjing", "year": 1937, "era": "抗日战争时期", "title": "南京大屠杀", "alias": "",
     "desc": "日军攻陷南京后，进行长达六周有组织之大屠杀、淫掠与焚毁。据战后南京军事法庭与远东国际军事法庭判定，遇难同胞逾三十万，为近代东亚最为骇人听闻之屠城惨案。",
     "keywords": ["南京"], "location": "江苏 南京", "type": "大屠杀"},
]


def history_events_to_rows():
    events = []
    for e in HISTORY_EVENTS:
        province, city = split_location(e["location"])
        events.append({
            "Id": gen_id(f"history:{e['id']}"),
            "Name": e["title"],
            "Alias": e.get("alias", ""),
            "EventType": e["type"],
            "Era": e["era"],
            "Year": e["year"],
            "Province": province,
            "City": city,
            "Location": e["location"],
            "IsGeneral": 0,
            "PersonCount": 0,
            "Summary": e["desc"],
            "Keywords": json.dumps(e["keywords"], ensure_ascii=False),
        })
    return events


# ---------------------------------------------------------------------------
# 3) 恶性事件.csv 推导新增的具体事件（不重复落入惨案/宏观事件集合）
# ---------------------------------------------------------------------------

# (事件名, 事件类型, 发生地点, 年份, 人员: [(姓名, 地点, 身份描述)])
EXTRA_EVENTS = [
    {"Name": "旅顺大屠杀", "EventType": "大屠杀", "Location": "辽宁 大连", "Year": 1894,
     "Summary": "甲午战争期间，日军攻陷旅顺后残酷屠戮城中山民军民逾两万，为中国近代史上惨绝人寰的大屠杀之一。",
     "Persons": [
         {"Name": "刘雨田", "Location": "辽宁大连",
          "IdentityTags": "关东州厅参事、大连市议员、华商公议会会长，关东都督府嘱托（高级顾问）；甲午战争主动给日军做向导，参与旅顺大屠杀引路"},
     ]},
    {"Name": "插箭岭屠杀", "EventType": "屠杀", "Location": "河北 邯郸", "Year": "",
     "Summary": "日本侵华时期邯郸一带的屠杀干部事件，伪邯郸警察所长卢万寿配合特务抓捕抗日人员直接参与。",
     "Persons": [
         {"Name": "卢万寿", "Location": "河北邯郸",
          "IdentityTags": "伪邯郸警察所长；配合特务抓捕抗日人员，参与插箭岭屠杀干部事件"},
     ]},
    {"Name": "芜湖城内大屠杀", "EventType": "大屠杀", "Location": "安徽 芜湖", "Year": "",
     "Summary": "日寇侵占芜湖时，汉奸任凤昌引狼入室，带日军开进芜湖制造城内大屠杀。",
     "Persons": [
         {"Name": "任凤昌", "Location": "安徽芜湖",
          "IdentityTags": "芜湖维持会首任会长；引狼入室，带日军从竹丝港开进芜湖，制造城内大屠杀；组建最早伪维持会，搜刮财物，强征粮草资敌"},
     ]},
]


def extra_events_to_rows():
    events = []
    persons = []
    for e in EXTRA_EVENTS:
        province, city = split_location(e["Location"])
        evt_id = gen_id(f"extra:{e['Name']}")
        events.append({
            "Id": evt_id,
            "Name": e["Name"],
            "Alias": "",
            "EventType": e["EventType"],
            "Era": "",
            "Year": e["Year"],
            "Province": province,
            "City": city,
            "Location": e["Location"],
            "IsGeneral": 0,
            "PersonCount": len(e["Persons"]),
            "Summary": e["Summary"],
            "Keywords": json.dumps([e["Name"]], ensure_ascii=False),
        })
        for i, p in enumerate(e["Persons"], start=1):
            persons.append({
                "Id": gen_id(f"person:{evt_id}:{p['Name']}"),
                "AtrocityCaseId": evt_id,
                "Name": p["Name"],
                "Location": p["Location"],
                "IdentityTags": p["IdentityTags"],
                "Sort": i,
            })
    return events, persons


# ---------------------------------------------------------------------------
# SQL 渲染
# ---------------------------------------------------------------------------

def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("\\", "\\\\").replace("'", "\\'") + "'"


def _quote(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def render_batch(events, persons, dialect):
    q = _quote if dialect == "sqlite" else esc

    def row_values(row, cols):
        return ", ".join(q(row[c]) for c in cols)

    cols = ["Id", "Name", "Alias", "EventType", "Era", "Year", "Province", "City",
            "Location", "IsGeneral", "PersonCount", "Summary", "Keywords", "CreatedAt", "UpdatedAt"]
    pcols = ["Id", "AtrocityCaseId", "Name", "Location", "IdentityTags", "Sort", "CreatedAt"]
    now = now_str()

    out = []
    for e in events:
        vals = [e[c] if c in e else "" for c in cols[:13]] + [now, now]
        # 数值列空值需为 NULL（Year/IsGeneral/PersonCount 不允许 ''）
        for i, c in enumerate(cols):
            if c in ("Year",) and vals[i] == "":
                vals[i] = None
        out.append(f"INSERT INTO {q_mysql('atrocitycases')} ({', '.join(q_mysql(c) for c in cols)}) VALUES ({', '.join(q(v) for v in vals)});")
    for p in persons:
        vals = [p[c] for c in pcols[:6]] + [now]
        out.append(f"INSERT INTO {q_mysql('atrocitycasepersons')} ({', '.join(q_mysql(c) for c in pcols)}) VALUES ({', '.join(q(v) for v in vals)});")
    return "\n".join(out)


def q_mysql(name):
    return "`" + name + "`"


# ---------------------------------------------------------------------------

def build_mysql(events, persons):
    hdr = textwrap.dedent(f"""\
        -- ============================================
        -- HanJianNet · 事件表 (atrocitycases / atrocitycasepersons)
        -- 数据来源：惨案事件汇总.csv + historyEvents.ts + 恶性事件.csv 推导
        -- 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        -- 惨案数:    {len(events)}
        -- 人员数:    {len(persons)}
        -- ============================================

        SET NAMES utf8mb4;
        SET FOREIGN_KEY_CHECKS = 0;

        DROP TABLE IF EXISTS `atrocitycasepersons`;
        DROP TABLE IF EXISTS `atrocitycases`;

        CREATE TABLE `atrocitycases` (
          `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
          `Name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '事件名称',
          `Alias` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '别名',
          `EventType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '事件类型(惨案/屠杀/大屠杀/事变/战役/国难)',
          `Era` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '时期(宋末/明末/清末/民国/抗日战争时期/其他)',
          `Year` int DEFAULT NULL COMMENT '年份',
          `Province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '省份',
          `City` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '城市',
          `Location` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '发生地点',
          `IsGeneral` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否通用描述（0=具体惨案 1=泛称）',
          `PersonCount` int NOT NULL DEFAULT '0' COMMENT '涉案人员数',
          `Summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '典型罪行摘要/事件描述',
          `Keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '关联检索关键词(JSON)',
          `CreatedAt` datetime(6) NOT NULL,
          `UpdatedAt` datetime(6) NOT NULL,
          PRIMARY KEY (`Id`),
          KEY `IX_AtrocityCases_Province` (`Province`),
          KEY `IX_AtrocityCases_Name` (`Name`(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        ;

        CREATE TABLE `atrocitycasepersons` (
          `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
          `AtrocityCaseId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '所属事件Id',
          `Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '涉案人员姓名',
          `Location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '人员地级信息',
          `IdentityTags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '身份/罪行描述',
          `Sort` int NOT NULL DEFAULT '0' COMMENT '排序',
          `CreatedAt` datetime(6) NOT NULL,
          PRIMARY KEY (`Id`),
          KEY `IX_AtrocityCasePersons_AtrocityCaseId` (`AtrocityCaseId`),
          CONSTRAINT `FK_AtrocityCasePersons_AtrocityCases_AtrocityCaseId`
            FOREIGN KEY (`AtrocityCaseId`) REFERENCES `atrocitycases` (`Id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        ;

        """)
    data = render_batch(events, persons, "mysql")
    return hdr + data + "\n\nSET FOREIGN_KEY_CHECKS = 1;\n"


def build_sqlite(events, persons):
    hdr = textwrap.dedent(f"""\
        -- ============================================
        -- HanJianNet · 事件表 (atrocitycases / atrocitycasepersons) - SQLite
        -- 数据来源：惨案事件汇总.csv + historyEvents.ts + 恶性事件.csv 推导
        -- 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        -- 惨案数:    {len(events)}
        -- 人员数:    {len(persons)}
        -- ============================================

        DROP TABLE IF EXISTS "atrocitycasepersons";
        DROP TABLE IF EXISTS "atrocitycases";

        CREATE TABLE "atrocitycases" (
          "Id" TEXT NOT NULL,
          "Name" TEXT NOT NULL,
          "Alias" TEXT,
          "EventType" TEXT,
          "Era" TEXT,
          "Year" INTEGER,
          "Province" TEXT,
          "City" TEXT,
          "Location" TEXT,
          "IsGeneral" INTEGER NOT NULL DEFAULT 0,
          "PersonCount" INTEGER NOT NULL DEFAULT 0,
          "Summary" TEXT,
          "Keywords" TEXT,
          "CreatedAt" TEXT NOT NULL,
          "UpdatedAt" TEXT NOT NULL,
          PRIMARY KEY ("Id")
        );
        CREATE INDEX "IX_AtrocityCases_Province" ON "atrocitycases" ("Province");
        CREATE INDEX "IX_AtrocityCases_Name" ON "atrocitycases" ("Name");

        CREATE TABLE "atrocitycasepersons" (
          "Id" TEXT NOT NULL,
          "AtrocityCaseId" TEXT NOT NULL,
          "Name" TEXT NOT NULL,
          "Location" TEXT,
          "IdentityTags" TEXT,
          "Sort" INTEGER NOT NULL DEFAULT 0,
          "CreatedAt" TEXT NOT NULL,
          PRIMARY KEY ("Id"),
          FOREIGN KEY ("AtrocityCaseId") REFERENCES "atrocitycases" ("Id") ON DELETE CASCADE
        );
        CREATE INDEX "IX_AtrocityCasePersons_AtrocityCaseId" ON "atrocitycasepersons" ("AtrocityCaseId");

        """)
    data = render_batch(events, persons, "sqlite")
    return hdr + data + "\n"


def main():
    os.makedirs(SQL_DIR, exist_ok=True)

    a_events, a_persons = parse_atrocity_csv()
    h_events = history_events_to_rows()
    x_events, x_persons = extra_events_to_rows()

    events = a_events + h_events + x_events
    persons = a_persons + x_persons

    print(f"惨案事件: {len(a_events)}  宏观历史事件: {len(h_events)}  恶性事件推导: {len(x_events)}")
    print(f"事件总数: {len(events)}  人员总数: {len(persons)}")

    with open(OUT_MYSQL, "w", encoding="utf-8") as f:
        f.write(build_mysql(events, persons))
    with open(OUT_SQLITE, "w", encoding="utf-8") as f:
        f.write(build_sqlite(events, persons))

    print(f"MySQL:   {OUT_MYSQL}")
    print(f"SQLite:  {OUT_SQLITE}")


if __name__ == "__main__":
    main()