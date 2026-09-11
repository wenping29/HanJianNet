#!/usr/bin/env python3
"""Generate crimerecords SQL from All_hanjian_dub_name_v9.csv.

Each row in the CSV represents a traitor. The `crimes` field contains
one or more crime descriptions separated by Chinese semicolons (；).
Each description is parsed into a separate row in the `crimerecords` table,
linked to traitors via TraitorId = CSV guid column.
"""

import csv
import os
import uuid

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "All_hanjian_dub_name_v9.csv")
OUTPUT_SQL = os.path.join(DATA_DIR, "crimerecords_insert.sql")

ID_PREFIX = "cr"  # short prefix so generated Ids are clearly crime records


def gen_id():
    return f"{ID_PREFIX}-{uuid.uuid4().hex}"


def escape_sql(s):
    if s is None:
        return "NULL"
    s = str(s)
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def to_int(val):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def extract_title(entry):
    """Extract a concise crime title from a crime description.

    Uses the first clause (before the first comma / 。) when possible,
    otherwise falls back to the full text truncated to 80 chars.
    """
    entry = entry.strip().strip("。；;，,")
    if not entry:
        return "汉奸罪行"

    for sep in ("，", ",", "。", "；", ":", "："):
        idx = entry.find(sep)
        if idx > 0:
            title = entry[:idx].strip()
            break
    else:
        title = entry

    # Post-process: drop trailing particles and leftover punctuation
    title = title.rstrip("的、和与及在，。；:： ")
    if not title:
        title = entry[:40]

    # Remove "伪职：" / "罪行：" prefixes occasionally present in entries
    for prefix in ("伪职：", "罪行：", "结局：", "身份："):
        if title.startswith(prefix):
            title = title[len(prefix):].strip()
            break

    return title[:120] or "汉奸罪行"


def main():
    total_rows = 0
    total_records = 0
    skipped_empty = 0
    skipped_no_source = 0
    records_per_traitor = []

    all_inserts = []

    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            guid = row.get("guid", "").strip()
            if not guid:
                continue

            crimes_raw = row.get("crimes", "")
            if not crimes_raw or crimes_raw.strip() == "未知":
                skipped_empty += 1
                continue

            source = row.get("source", "")
            if not source:
                skipped_no_source += 1

            harm_desc = row.get("harm_desc", "")
            harm_level = row.get("harm_level", "")
            harm_name = row.get("harm_name", "")
            title_hint = row.get("title", "")
            period_start = to_int(row.get("period_start", ""))

            # Combine harm info: use harm_level + harm_name + harm_desc
            harm_parts = []
            if harm_level:
                harm_parts.append(f"危害等级{harm_level}")
            if harm_name:
                harm_parts.append(harm_name)
            if harm_desc and harm_desc not in harm_parts:
                harm_parts.append(harm_desc)
            harm = "（".join(harm_parts[:1])  # keep concise
            if len(harm_parts) > 1:
                harm = f"{harm_parts[0]}（{'，'.join(harm_parts[1:])}）"

            entries = [e.strip() for e in crimes_raw.replace(";", "；").split("；")]
            entries = [e for e in entries if e]

            count = 0
            for entry in entries:
                title = extract_title(entry)
                process = entry
                year = period_start if period_start else None

                rec_id = gen_id()
                all_inserts.append(
                    "INSERT INTO `crimerecords` "
                    "(`Id`,`TraitorId`,`Year`,`Title`,`Process`,`Harm`,`SourceRef`) VALUES ("
                    f"{escape_sql(rec_id)},"
                    f"{escape_sql(guid)},"
                    f"{'NULL' if year is None else year},"
                    f"{escape_sql(title)},"
                    f"{escape_sql(process)},"
                    f"{escape_sql(harm)},"
                    f"{escape_sql(source)});"
                )
                count += 1
            total_records += count
            records_per_traitor.append(count)

    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("-- ===============================================\n")
        f.write("-- HanJianNet - crimerecords insert statements\n")
        f.write("-- Source: All_hanjian_dub_name_v9.csv\n")
        f.write(f"-- Generated: rows={total_rows}, records={total_records}, "
                f"skipped_empty={skipped_empty}\n")
        f.write("-- TraitorId = CSV guid (matches traitors.Id)\n")
        f.write("-- ===============================================\n\n")
        f.write("SET NAMES utf8mb4;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
        f.write("\n".join(all_inserts))
        f.write("\n\nSET FOREIGN_KEY_CHECKS = 1;\n")

    avg = (sum(records_per_traitor) / len(records_per_traitor)) if records_per_traitor else 0
    print(f"Total rows in CSV: {total_rows}")
    print(f"Traitors with clean crime entries: {total_rows - skipped_empty}")
    print(f"Crimerecords generated: {total_records}")
    print(f"Skipped (no useful crime text): {skipped_empty}")
    print(f"Avg records per traitor: {avg:.1f}")
    print(f"SQL written to: {OUTPUT_SQL}")


if __name__ == "__main__":
    main()