param(
    [string]$CsvPath = "D:\Project\HanJianNet\webapi\data\All_hanjian_dub_name_v9.csv",
    [string]$OutputPath = "D:\Project\HanJianNet\webapi\data\crimes_insert.sql"
)

$csv = Import-Csv -Path $CsvPath -Encoding UTF8

function Escape-String {
    param([string]$val)
    if ([string]::IsNullOrEmpty($val)) { return $null }
    $val = $val.Replace('\', '\\')
    $val = $val.Replace("'", "''")
    $val = $val.Replace('"', '\"')
    return $val
}

function Format-Value {
    param([string]$val, [string]$type = "string")
    if ([string]::IsNullOrEmpty($val)) { return "NULL" }
    $escaped = Escape-String $val
    switch ($type) {
        "int" {
            if ($val -match '^\d+$') { return $val }
            return "NULL"
        }
        default { return "'$escaped'" }
    }
}

$total = $csv.Count
$current = 0

$bt = [char]0x60
$q = [string]::Format('{0}', $bt)

$stream = [System.IO.StreamWriter]::new($OutputPath, $false, [System.Text.Encoding]::UTF8)

$stream.WriteLine("-- 犯罪记录MySQL导入脚本")
$stream.WriteLine("-- 生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$stream.WriteLine("-- 数据来源: All_hanjian_dub_name_v9.csv")
$stream.WriteLine("-- 总记录数: $total")
$stream.WriteLine("")
$stream.WriteLine("SET NAMES utf8mb4;")
$stream.WriteLine("SET FOREIGN_KEY_CHECKS = 0;")
$stream.WriteLine("")

$stream.WriteLine("CREATE TABLE IF NOT EXISTS ${q}crimes${q} (")
$stream.WriteLine("  ${q}id${q} BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,")
$stream.WriteLine("  ${q}guid${q} VARCHAR(36) NOT NULL,")
$stream.WriteLine("  ${q}name${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}title${q} VARCHAR(500) DEFAULT NULL,")
$stream.WriteLine("  ${q}source${q} VARCHAR(50) DEFAULT NULL,")
$stream.WriteLine("  ${q}courtesy_name${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}pseudonym${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}birth_year${q} INT DEFAULT NULL,")
$stream.WriteLine("  ${q}birth_year_type${q} VARCHAR(20) DEFAULT NULL,")
$stream.WriteLine("  ${q}death_year${q} INT DEFAULT NULL,")
$stream.WriteLine("  ${q}death_year_type${q} VARCHAR(20) DEFAULT NULL,")
$stream.WriteLine("  ${q}native_place${q} VARCHAR(1000) DEFAULT NULL,")
$stream.WriteLine("  ${q}hometown_province${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}hometown_city${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}hometown_county${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}town${q} VARCHAR(200) DEFAULT NULL,")
$stream.WriteLine("  ${q}village${q} VARCHAR(200) DEFAULT NULL,")
$stream.WriteLine("  ${q}source_area${q} VARCHAR(2000) DEFAULT NULL,")
$stream.WriteLine("  ${q}period${q} VARCHAR(100) DEFAULT NULL,")
$stream.WriteLine("  ${q}faction${q} VARCHAR(50) DEFAULT NULL,")
$stream.WriteLine("  ${q}summary${q} TEXT DEFAULT NULL,")
$stream.WriteLine("  ${q}crimes${q} TEXT DEFAULT NULL,")
$stream.WriteLine("  ${q}fate${q} VARCHAR(200) DEFAULT NULL,")
$stream.WriteLine("  ${q}residence_changes${q} TEXT DEFAULT NULL,")
$stream.WriteLine("  ${q}harm_level${q} VARCHAR(10) DEFAULT NULL,")
$stream.WriteLine("  ${q}harm_name${q} VARCHAR(200) DEFAULT NULL,")
$stream.WriteLine("  ${q}harm_desc${q} VARCHAR(500) DEFAULT NULL,")
$stream.WriteLine("  ${q}period_raw${q} VARCHAR(500) DEFAULT NULL,")
$stream.WriteLine("  ${q}period_note${q} VARCHAR(500) DEFAULT NULL,")
$stream.WriteLine("  ${q}period_start${q} INT DEFAULT NULL,")
$stream.WriteLine("  ${q}period_end${q} INT DEFAULT NULL,")
$stream.WriteLine("  ${q}merged_count${q} INT DEFAULT NULL,")
$stream.WriteLine("  PRIMARY KEY (${q}id${q}),")
$stream.WriteLine("  INDEX ${q}idx_guid${q} (${q}guid${q}),")
$stream.WriteLine("  INDEX ${q}idx_name${q} (${q}name${q}),")
$stream.WriteLine("  INDEX ${q}idx_harm_level${q} (${q}harm_level${q}),")
$stream.WriteLine("  INDEX ${q}idx_period_start${q} (${q}period_start${q}),")
$stream.WriteLine("  INDEX ${q}idx_period_end${q} (${q}period_end${q})")
$stream.WriteLine(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;")
$stream.WriteLine("")
$stream.WriteLine("SET FOREIGN_KEY_CHECKS = 0;")
$stream.WriteLine("")

$colList = "${q}guid${q},${q}name${q},${q}title${q},${q}source${q},${q}courtesy_name${q},${q}pseudonym${q},${q}birth_year${q},${q}birth_year_type${q},${q}death_year${q},${q}death_year_type${q},${q}native_place${q},${q}hometown_province${q},${q}hometown_city${q},${q}hometown_county${q},${q}town${q},${q}village${q},${q}source_area${q},${q}period${q},${q}faction${q},${q}summary${q},${q}crimes${q},${q}fate${q},${q}residence_changes${q},${q}harm_level${q},${q}harm_name${q},${q}harm_desc${q},${q}period_raw${q},${q}period_note${q},${q}period_start${q},${q}period_end${q},${q}merged_count${q}"

$batchSize = 500
$batchCount = 0

foreach ($row in $csv) {
    $current++
    $batchCount++

    $guid = Format-Value $row.guid
    $name = Format-Value $row.name
    $title = Format-Value $row.title
    $source = Format-Value $row.source
    $courtesyName = Format-Value $row.courtesy_name
    $pseudonym = Format-Value $row.pseudonym
    $birthYear = Format-Value $row.birth_year "int"
    $birthYearType = Format-Value $row.birth_year_type
    $deathYear = Format-Value $row.death_year "int"
    $deathYearType = Format-Value $row.death_year_type
    $nativePlace = Format-Value $row.native_place
    $hometownProvince = Format-Value $row.hometown_province
    $hometownCity = Format-Value $row.hometown_city
    $hometownCounty = Format-Value $row.hometown_county
    $town = Format-Value $row.town
    $village = Format-Value $row.village
    $sourceArea = Format-Value $row.source_area
    $period = Format-Value $row.period
    $faction = Format-Value $row.faction
    $summary = Format-Value $row.summary
    $crimes = Format-Value $row.crimes
    $fate = Format-Value $row.fate
    $residenceChanges = Format-Value $row.residence_changes
    $harmLevel = Format-Value $row.harm_level
    $harmName = Format-Value $row.harm_name
    $harmDesc = Format-Value $row.harm_desc
    $periodRaw = Format-Value $row.period_raw
    $periodNote = Format-Value $row.period_note
    $periodStart = Format-Value $row.period_start "int"
    $periodEnd = Format-Value $row.period_end "int"
    $mergedCount = Format-Value $row.merged_count "int"

    $vals = @($guid,$name,$title,$source,$courtesyName,$pseudonym,$birthYear,$birthYearType,$deathYear,$deathYearType,$nativePlace,$hometownProvince,$hometownCity,$hometownCounty,$town,$village,$sourceArea,$period,$faction,$summary,$crimes,$fate,$residenceChanges,$harmLevel,$harmName,$harmDesc,$periodRaw,$periodNote,$periodStart,$periodEnd,$mergedCount)
    $valsStr = $vals -join ','
    $stream.WriteLine("INSERT INTO ${q}crimes${q} ($colList) VALUES ($valsStr);")

    if ($batchCount -ge $batchSize) {
        $stream.WriteLine("")
        $batchCount = 0
        Write-Progress -Activity "生成SQL脚本" -Status "已处理 $current / $total" -PercentComplete (($current / $total) * 100)
    }
}

$stream.WriteLine("")
$stream.WriteLine("COMMIT;")
$stream.WriteLine("")
$stream.WriteLine("SET FOREIGN_KEY_CHECKS = 1;")
$stream.Close()

Write-Host "完成! 共生成 $total 条INSERT语句" -ForegroundColor Green
Write-Host "输出文件: $OutputPath" -ForegroundColor Yellow
