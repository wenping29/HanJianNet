/**
 * 省份匹配工具 — 从籍贯字符串中提取省份
 * 支持历史省名（如直隶→河北、奉天→辽宁）
 */

/** 现代 23 省 + 4 直辖市 + 5 自治区 + 2 特区 */
const PROVINCES = [
  '北京', '天津', '上海', '重庆',
  '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '海南',
  '四川', '贵州', '云南', '陕西', '甘肃', '青海',
  '内蒙古', '广西', '西藏', '宁夏', '新疆',
  '台湾', '香港', '澳门',
] as const

/** 历史省名 → 现代省名 */
const HISTORICAL_MAP: Record<string, string> = {
  '直隶': '河北',
  '奉天': '辽宁',
  '热河': '河北',
  '察哈尔': '河北',
  '绥远': '内蒙古',
  '西康': '四川',
  '安东': '辽宁',
  '辽北': '辽宁',
  '松江': '黑龙江',
  '合江': '黑龙江',
  '嫩江': '黑龙江',
  '兴安': '内蒙古',
  '满洲': '黑龙江',
  '新京': '吉林',
}

/** 所有可匹配的省名前缀（按长度降序，优先匹配 3 字） */
const ALL_PREFIXES = [...PROVINCES, ...Object.keys(HISTORICAL_MAP)].sort(
  (a, b) => b.length - a.length,
)

/**
 * 从籍贯字符串中提取省份
 * @returns 标准化后的现代省名，或 null（无法识别）
 */
export function matchProvince(nativePlace: string): string | null {
  if (!nativePlace) return null
  const s = nativePlace.trim()

  for (const prefix of ALL_PREFIXES) {
    if (s.startsWith(prefix) || s.includes(prefix)) {
      return HISTORICAL_MAP[prefix] ?? prefix
    }
  }

  return null
}

/** 获取所有省份列表 */
export function getProvinceList(): string[] {
  return [...PROVINCES]
}

/** 省份短名 → GeoJSON 全称（匹配 DataV 地图要素 name） */
const FULL_NAME_MAP: Record<string, string> = {
  '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
  '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
  '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
  '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
  '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '海南': '海南省',
  '四川': '四川省', '贵州': '贵州省', '云南': '云南省', '陕西': '陕西省',
  '甘肃': '甘肃省', '青海': '青海省', '台湾': '台湾省',
  '内蒙古': '内蒙古自治区', '广西': '广西壮族自治区', '西藏': '西藏自治区',
  '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
  '香港': '香港特别行政区', '澳门': '澳门特别行政区',
}

/** 短名转 GeoJSON 全称 */
export function fullProvinceName(short: string): string {
  return FULL_NAME_MAP[short] ?? short
}
