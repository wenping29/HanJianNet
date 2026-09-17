import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

/// 纬度缩放系数：cos(35°)，等距圆柱投影下保持中国地图形状不走样。
const double _kLatScale = 0.819;

/// 省份形状：投影坐标系下的多边形（每个多边形首环为外环，其余为孔洞）。
class ProvinceShape {
  final String name; // GeoJSON 全称，如「河南省」
  final List<List<List<Offset>>> polygons;
  final Path path;

  const ProvinceShape({required this.name, required this.polygons, required this.path});

  bool contains(Offset p) => polygons.any((rings) =>
      _inRing(p, rings.first) && !rings.skip(1).any((hole) => _inRing(p, hole)));

  /// 射线法判断点是否在环内。
  static bool _inRing(Offset p, List<Offset> ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      final a = ring[i];
      final b = ring[j];
      if ((a.dy > p.dy) != (b.dy > p.dy) &&
          p.dx < (b.dx - a.dx) * (p.dy - a.dy) / (b.dy - a.dy) + a.dx) {
        inside = !inside;
      }
    }
    return inside;
  }
}

class ChinaMapData {
  final List<ProvinceShape> provinces;
  final Rect bounds;

  const ChinaMapData({required this.provinces, required this.bounds});

  /// 从内置资产加载并解析中国省份 GeoJSON（与 web 端同源：100000_full.json）。
  static Future<ChinaMapData> load() async {
    final raw = await rootBundle.loadString('assets/data/china_geo.json');
    final geo = jsonDecode(raw) as Map<String, dynamic>;
    final features = (geo['features'] as List).cast<Map<String, dynamic>>();

    final provinces = <ProvinceShape>[];
    var minX = double.infinity, minY = double.infinity;
    var maxX = double.negativeInfinity, maxY = double.negativeInfinity;

    Offset project(num lng, num lat) => Offset(lng.toDouble(), -lat.toDouble() * _kLatScale);

    for (final f in features) {
      final name = (f['properties'] as Map<String, dynamic>)['name'] as String? ?? '';
      final geometry = f['geometry'] as Map<String, dynamic>?;
      if (name.isEmpty || geometry == null) continue;

      // 统一为 MultiPolygon 结构：[polygon][ring][point]
      final rawCoords = geometry['coordinates'] as List;
      final multiPolygons = geometry['type'] == 'Polygon' ? [rawCoords] : rawCoords;

      final polygons = <List<List<Offset>>>[];
      final path = Path();
      for (final poly in multiPolygons) {
        final rings = <List<Offset>>[];
        for (final ring in (poly as List)) {
          final pts = <Offset>[];
          for (final c in (ring as List)) {
            final p = project(c[0] as num, c[1] as num);
            pts.add(p);
            minX = math.min(minX, p.dx);
            minY = math.min(minY, p.dy);
            maxX = math.max(maxX, p.dx);
            maxY = math.max(maxY, p.dy);
          }
          rings.add(pts);
          path.addPolygon(pts, true);
        }
        polygons.add(rings);
      }
      if (polygons.isNotEmpty) {
        provinces.add(ProvinceShape(name: name, polygons: polygons, path: path));
      }
    }

    return ChinaMapData(
      provinces: provinces,
      bounds: Rect.fromLTRB(minX, minY, maxX, maxY),
    );
  }
}

/// 计算投影坐标 → 画布的变换（留白 4% 并居中），命中测试与绘制共用同一套。
({double scale, Offset offset}) chinaMapTransform(ChinaMapData data, Size size) {
  final scale = math.min(
          size.width / data.bounds.width, size.height / data.bounds.height) *
      0.92;
  final dx = (size.width - data.bounds.width * scale) / 2 - data.bounds.left * scale;
  final dy = (size.height - data.bounds.height * scale) / 2 - data.bounds.top * scale;
  return (scale: scale, offset: Offset(dx, dy));
}

class ChinaMapPainter extends CustomPainter {
  final ChinaMapData data;
  final Map<String, int> countByName; // 键为 GeoJSON 全称
  final String? selectedName;
  final Color baseColor;
  final Color borderColor;
  final Color fillColor;
  final Color selectedColor;

  ChinaMapPainter({
    required this.data,
    required this.countByName,
    required this.selectedName,
    required this.baseColor,
    required this.borderColor,
    required this.fillColor,
    required this.selectedColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final t = chinaMapTransform(data, size);
    canvas.save();
    canvas.translate(t.offset.dx, t.offset.dy);
    canvas.scale(t.scale);

    final maxCount = math.max(1, countByName.values.fold(0, math.max));
    final border = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8 / t.scale
      ..color = borderColor;

    for (final p in data.provinces) {
      final count = countByName[p.name] ?? 0;
      final Color color;
      if (p.name == selectedName) {
        color = selectedColor;
      } else if (count <= 0) {
        color = baseColor;
      } else {
        // 与 web 端 visualMap 一致：朱砂透明度渐变（0.12 → 1.0），开平方提亮低值
        final alpha = 0.12 + 0.88 * math.sqrt(count / maxCount);
        color = fillColor.withValues(alpha: alpha.clamp(0.0, 1.0));
      }
      canvas.drawPath(p.path, Paint()..color = color);
      canvas.drawPath(p.path, border);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(ChinaMapPainter old) =>
      old.selectedName != selectedName || old.countByName != countByName;
}

/// 中国地图：展示分省数量分布，支持缩放拖动与省份点选。
class ChinaMap extends StatelessWidget {
  final ChinaMapData data;
  final Map<String, int> countByName;
  final String? selectedName;
  final ValueChanged<ProvinceShape>? onProvinceTap;

  const ChinaMap({
    super.key,
    required this.data,
    required this.countByName,
    this.selectedName,
    this.onProvinceTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        return GestureDetector(
          onTapUp: (d) {
            if (onProvinceTap == null) return;
            final t = chinaMapTransform(data, size);
            final point = Offset(
              (d.localPosition.dx - t.offset.dx) / t.scale,
              (d.localPosition.dy - t.offset.dy) / t.scale,
            );
            for (final p in data.provinces) {
              if (p.contains(point)) {
                onProvinceTap!(p);
                return;
              }
            }
          },
          child: CustomPaint(
            size: size,
            painter: ChinaMapPainter(
              data: data,
              countByName: countByName,
              selectedName: selectedName,
              baseColor: isDark ? const Color(0xFF2B2620) : const Color(0xFFEAE1CC),
              borderColor: isDark
                  ? const Color(0x59C9BFA6)
                  : const Color(0x596F6654),
              fillColor: const Color(0xFF9B2B2B),
              selectedColor: const Color(0xFFC04A3A),
            ),
          ),
        );
      },
    );
  }
}
