#!/usr/bin/env python3
"""Generate traitors + crimerecords SQL from All_hanjian_dub_name_v9 (2).csv.

Replicates the exact format of the existing traitors_v9_insert.sql and
crimerecords_v9_insert.sql files (generated 2026-09-12 from this dataset):

Traitors (merged by name, file row order):
  Id               = md5hex(Name)
  Birth/DeathYear  = first non-empty value per merged group
  Birth/DeathType  = 'exact' always
  NativePlace      = first-occurrence dedup of rows, joined by '；'
  AliasesJson      = courtesy_name + pseudonym (json array)
  IdentityTagsJson = row-order title list (json array)
  Period/Faction   = first-occurrence dedup joined by '；'
  Summary          = per row: optional '伪职：{title}' prefix + summary, '；'-joined
  Province/City/Country = first-occurrence dedup of hometown_* joined by '；'; '' when empty
  Created/Updated  = fixed import timestamp; BirthPlace ''; Town/Village/Merged* NULL

Crimerecords (one record per crime clause):
  Id = 'cr-' + uuid4().hex; TraitorId = md5hex(CSV name); Name = CSV name
  Year = period_start (int/NULL); Title = extract_title(entry); Process = entry
  Harm = '危害等级{level}（{name}，{desc}）'; SourceRef = source (raw)
  crimes split by '；'/' ; '; rows with empty/未知 crimes are skipped.
"""

import argparse
import csv
import hashlib
import json
import os
import sys
import uuid
from collections import OrderedDict
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "All_hanjian_dub_name_v9 (2).csv")

TRAITORS_COLS = [
    "Id", "Name", "CourtesyName", "Pseudonym", "BirthYear", "DeathYear",
    "BirthYearType", "DeathYearType", "NativePlace", "AliasesJson",
    "IdentityTagsJson", "Period", "Faction", "Summary", "RelatedIdsJson",
    "CreatedAt", "UpdatedAt", "Province", "City", "Country", "Town", "Village",
    "MergedIntoId", "MergedAt", "BirthPlace",
]

CRIMES_COLS = ["Id", "TraitorId", "Name", "Year", "Title", "Process", "Harm", "SourceRef"]

# MySQL chars limits (INFORMATION_SCHEMA: Province/City/Country/Town/Village varchar(100),
# BirthPlace varchar(255); NativePlace/Summary/JSON 等为 longtext)
CHAR_LIMITS = {
    "Province": 100, "City": 100, "Country": 100,
    "Town": 100, "Village": 100, "BirthPlace": 255,
}

TRAITORS_HEADER = [
    "-- ===============================================",
    "-- HanJianNet - 汉奸文件（traitors insert statements）",
    "-- Source: All_hanjian_dub_name_v9 (2).csv（按姓名合并唯一人物）",
    "-- Generated: rows={rows}, persons={persons}, at {ts}",
    "-- Id = md5hex(Name)（确定性 Id，与按姓名合并一致；crimerecords 通过同名引用）",
    "-- Province/City/Country 按库表 varchar(100) 截断（超长补 …）；NativePlace 为 longtext 不截断",
    "-- ===============================================",
]

CRIMES_HEADER = [
    "-- ===============================================",
    "-- HanJianNet - 汉奸罪行文件（crimerecords insert statements）",
    "-- Source: All_hanjian_dub_name_v9 (2).csv（crimes 列按 ；拆分为逐条罪行）",
    "-- Generated: rows={rows}, records={records}, skipped_empty={skipped}, at {ts}",
    "-- TraitorId = md5hex(CSV.name)，对应 traitors 中的同名 Id",
    "-- 列说明: Year<-period_start, Title/Process<-crimes 分句, Harm<-危害等级*, SourceRef<-source",
    "-- ===============================================",
]


def md5hex(s):
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def escape_sql(s):
    if s is None:
        return "NULL"
    s = str(s)
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def cap(s, limit):
    """Truncate to the column char limit, appending '…' when cut, so the
    joined '；' list never overflows the schema's varchar(N)."""
    if limit is None or s is None or len(s) <= limit:
        return s
    return s[:limit - 1].rstrip("；") + "…"


def to_int(val):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def extract_title(entry):
    entry = entry.strip().strip("。；;，，")
    if not entry:
        return "汉奸罪行"
    for sep in ("，", ",", "。", "；", ":", "："):
        idx = entry.find(sep)
        if idx > 0:
            title = entry[:idx].strip()
            break
    else:
        title = entry
    title = title.rstrip("的、和与及在，。；:： ")
    if not title:
        title = entry[:40]
    for prefix in ("伪职：", "罪行：", "结局：", "身份："):
        if title.startswith(prefix):
            title = title[len(prefix):].strip()
            break
    return title[:120] or "汉奸罪行"


def join_dedup(vals):
    seen = set()
    out = []
    for v in vals:
        s = (v or "").strip()
        if s and s not in seen:
            seen.add(s)
            out.append(s)
    return "；".join(out)


def harm_str(harm_level, harm_name, harm_desc):
    parts = []
    if harm_level:
        parts.append(f"危害等级{harm_level}")
    if harm_name:
        parts.append(harm_name)
    if harm_desc and harm_desc not in parts:
        parts.append(harm_desc)
    if not parts:
        return ""
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]}（{'，'.join(parts[1:])}）"


def load_rows():
    with open(CSV_PATH, "r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def group_by_name(rows):
    grouped = OrderedDict()
    for r in rows:
        name = (r.get("name") or "").strip()
        if not name:
            continue
        grouped.setdefault(name, []).append(r)
    return grouped


def gen_traitors_row(name, group, ts):
    birth = next((to_int(g.get("birth_year")) for g in group
                  if (g.get("birth_year") or "").strip()), None)
    death = next((to_int(g.get("death_year")) for g in group
                  if (g.get("death_year") or "").strip()), None)

    aliases = []
    for g in group:
        if (g.get("courtesy_name") or "").strip():
            aliases.append(g["courtesy_name"].strip())
        if (g.get("pseudonym") or "").strip():
            aliases.append(g["pseudonym"].strip())

    tags = []
    pieces = []
    for g in group:
        title = (g.get("title") or "").strip()
        summary = (g.get("summary") or "").strip()
        if title:
            tags.append(title)
            prefix = f"伪职：{title}"
            if not summary.startswith(prefix):
                pieces.append(prefix)
        if summary:
            pieces.append(summary)

    row = {
        "Id": md5hex(name),
        "Name": name,
        "CourtesyName": None,
        "Pseudonym": None,
        "BirthYear": birth,
        "DeathYear": death,
        "BirthYearType": "exact",
        "DeathYearType": "exact",
        "NativePlace": join_dedup(g.get("native_place") for g in group),
        "AliasesJson": json.dumps(aliases, ensure_ascii=False) if aliases else "[]",
        "IdentityTagsJson": json.dumps(tags, ensure_ascii=False) if tags else "[]",
        "Period": join_dedup(g.get("period") for g in group),
        "Faction": join_dedup(g.get("faction") for g in group),
        "Summary": "；".join(pieces),
        "RelatedIdsJson": "[]",
        "CreatedAt": ts,
        "UpdatedAt": ts,
        "Province": cap(join_dedup(g.get("hometown_province") for g in group), CHAR_LIMITS["Province"]),
        "City": cap(join_dedup(g.get("hometown_city") for g in group), CHAR_LIMITS["City"]),
        "Country": cap(join_dedup(g.get("hometown_county") for g in group), CHAR_LIMITS["Country"]),
        "Town": None,
        "Village": None,
        "MergedIntoId": None,
        "MergedAt": None,
        "BirthPlace": "",
    }
    return row


def gen_crimes_rows(rows_in_file_order):
    out = []
    skipped = 0
    for g in rows_in_file_order:
        crimes_raw = g.get("crimes", "")
        if not crimes_raw or crimes_raw.strip() == "未知":
            skipped += 1
            continue
        name = (g.get("name") or "").strip()
        if not name:
            continue
        source = g.get("source", "")
        harm = harm_str(g.get("harm_level", ""), g.get("harm_name", ""),
                        g.get("harm_desc", ""))
        year = to_int(g.get("period_start"))
        entries = [e.strip() for e in crimes_raw.replace(";", "；").split("；")]
        for entry in entries:
            if not entry:
                continue
            out.append({
                "Id": f"cr-{uuid.uuid4().hex}",
                "TraitorId": md5hex(name),
                "Name": name,
                "Year": year,
                "Title": extract_title(entry),
                "Process": entry,
                "Harm": harm,
                "SourceRef": source,
            })
    return out, skipped


def render_inserts(cols, rows, gap=False):
    col_text = ",".join(f"`{c}`" for c in cols)
    gap_text = " " if gap else ""
    lines = []
    for r in rows:
        vals = []
        for c in cols:
            v = r[c]
            if v is None:
                vals.append("NULL")
            elif isinstance(v, int):
                vals.append(str(v))
            else:
                vals.append(escape_sql(v))
        lines.append(f"INSERT INTO `{TABLE}`{gap_text}({col_text}) VALUES ({','.join(vals)});")
    return lines


def render_traitors(grouped, ts, nrows=None):
    global TABLE
    TABLE = "traitors"
    rows = [gen_traitors_row(n, g, ts) for n, g in grouped.items()]

    header = [ln.format(rows=nrows if nrows is not None else len(rows), persons=len(rows), ts=ts)
              for ln in TRAITORS_HEADER]
    body = render_inserts(TRAITORS_COLS, rows, gap=False)
    return header, body, rows


def render_crimes(rows, grouped, ts, nrows=None):
    global TABLE
    TABLE = "crimerecords"
    records, skipped = gen_crimes_rows(rows)

    header = [ln.format(rows=nrows if nrows is not None else len(grouped),
                        records=len(records), skipped=skipped, ts=ts)
              for ln in CRIMES_HEADER]
    body = render_inserts(CRIMES_COLS, records, gap=True)
    return header, body, records


def write_sql(path, header, body):
    lines = header + ["", "SET NAMES utf8mb4;", "SET FOREIGN_KEY_CHECKS = 0;", ""]
    lines += body
    lines += ["", "SET FOREIGN_KEY_CHECKS = 1;"]
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write("\n".join(lines))


TABLE = ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ts", default=datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))
    ap.add_argument("--outdir", default=DATA_DIR)
    ap.add_argument("--traitors-out", default="traitors_v9_2_insert.sql")
    ap.add_argument("--crimes-out", default="crimerecords_v9_2_insert.sql")
    args = ap.parse_args()

    rows = load_rows()
    nrows = len(rows)
    grouped = group_by_name(rows)

    th, tb, trows = render_traitors(grouped, args.ts, nrows)
    ch, cb, crows = render_crimes(rows, grouped, args.ts, nrows)

    tpath = os.path.join(args.outdir, args.traitors_out)
    cpath = os.path.join(args.outdir, args.crimes_out)
    write_sql(tpath, th, tb)
    write_sql(cpath, ch, cb)

    print(f"rows={nrows}, persons={len(trows)}, records={len(crows)}")
    print(f"traitors -> {tpath}")
    print(f"crimerecords -> {cpath}")


if __name__ == "__main__":
    main()