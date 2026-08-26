import csv
import os
import uuid
import json
import re
from datetime import datetime

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(DATA_DIR, "import_traitors.sql")

def extract_tags(position_text):
    tags = []
    patterns = [
        (r"省[长市]?", "省级长官"),
        (r"市长?", "市长"),
        (r"院长?", "院长"),
        (r"部长?", "部长"),
        (r"军长?", "军长"),
        (r"师长?", "师长"),
        (r"旅长?", "旅长"),
        (r"司令", "司令"),
        (r"厅长?", "厅长"),
        (r"处长?", "处长"),
        (r"委员长?", "委员长"),
        (r"总司令", "总司令"),
        (r"特务", "特务"),
        (r"清乡", "清乡"),
        (r"维持会", "维持会"),
        (r"县长?", "县长"),
    ]
    for pat, tag in patterns:
        if re.search(pat, position_text):
            tags.append(tag)
    return tags

def extract_faction(position_text):
    if "汪伪" in position_text:
        return "汪伪政权"
    if "维新政府" in position_text:
        return "南京伪维新政府"
    if "华北" in position_text or "临时政府" in position_text:
        return "华北伪临时政府"
    if "皇协军" in position_text or "伪军" in position_text:
        return "伪军"
    return "汪伪政权"

def escape_sql(s):
    if s is None:
        return "NULL"
    return s.replace("\\", "\\\\").replace("'", "\\'")

def parse_csv_file(filepath):
    records = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header:
            return records
        for row in reader:
            if len(row) < 2:
                continue
            name = row[0].strip() if len(row) > 0 else ""
            native_place = row[1].strip() if len(row) > 1 else ""
            position = row[2].strip() if len(row) > 2 else ""
            outcome = row[3].strip() if len(row) > 3 else ""
            if not name:
                continue
            records.append({
                "name": name,
                "native_place": native_place,
                "position": position,
                "outcome": outcome,
            })
    return records

def build_summary(position, outcome):
    parts = []
    if position:
        parts.append(f"伪任职务：{position}")
    if outcome:
        parts.append(f"结局：{outcome}")
    return "。".join(parts) if parts else ""

def main():
    all_records = []
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.endswith(".csv"):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        records = parse_csv_file(fpath)
        all_records.extend(records)
        print(f"  {fname}: {len(records)} records")

    print(f"\nTotal records: {len(all_records)}")

    seen = set()
    unique_records = []
    for r in all_records:
        key = r["name"]
        if key not in seen:
            seen.add(key)
            unique_records.append(r)
        else:
            print(f"  Duplicate skipped: {key}")

    print(f"After dedup: {len(unique_records)}")

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S.000000")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- HanJianNet Traitors Import\n")
        f.write(f"-- Generated: {now}\n")
        f.write(f"-- Total: {len(unique_records)} records\n")
        f.write("SET NAMES utf8mb4;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

        for r in unique_records:
            tags = extract_tags(r["position"])
            faction = extract_faction(r["position"])
            summary = build_summary(r["position"], r["outcome"])
            tid = uuid.uuid4().hex

            sql = (
                f"INSERT INTO `Traitors` "
                f"(`Id`,`Name`,`CourtesyName`,`Pseudonym`,`BirthYear`,`DeathYear`,"
                f"`BirthYearType`,`DeathYearType`,`NativePlace`,`AliasesJson`,"
                f"`IdentityTagsJson`,`Period`,`Faction`,`Summary`,`RelatedIdsJson`,"
                f"`CreatedAt`,`UpdatedAt`) VALUES ("
                f"'{tid}',"
                f"'{escape_sql(r['name'])}',"
                f"NULL,NULL,NULL,NULL,"
                f"'','',"
                f"'{escape_sql(r['native_place'])}',"
                f"'[]',"
                f"'{escape_sql(json.dumps(tags, ensure_ascii=False))}',"
                f"'抗日战争时期',"
                f"'{escape_sql(faction)}',"
                f"'{escape_sql(summary)}',"
                f"'[]',"
                f"'{now}','{now}');"
            )
            f.write(sql + "\n")

        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")

    print(f"\nSQL file generated: {OUTPUT_FILE}")
    print(f"Total INSERT statements: {len(unique_records)}")

if __name__ == "__main__":
    main()
