import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:hanjian_mobileapp/main.dart';

void main() {
  testWidgets('renders the app shell before session loading completes', (WidgetTester tester) async {
    await tester.pumpWidget(const HanJianApp());

    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
