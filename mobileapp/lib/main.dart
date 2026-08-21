import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'screens/profile_screen.dart';
import 'services/session.dart';
import 'widgets/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Session.instance.load();
  runApp(const HanJianApp());
}

class HanJianApp extends StatelessWidget {
  const HanJianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '汉奸档案 · HanJianNet',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: const RootNav(),
    );
  }
}

/// 底部导航：首页 / 个人中心。
class RootNav extends StatefulWidget {
  const RootNav({super.key});

  @override
  State<RootNav> createState() => _RootNavState();
}

class _RootNavState extends State<RootNav> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [HomeScreen(), ProfileScreen()],
      ),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: AppTheme.inkCard,
          indicatorColor: AppTheme.cinnabar.withValues(alpha: 0.35),
          labelTextStyle: WidgetStatePropertyAll(TextStyle(
            fontSize: 11,
            letterSpacing: 2,
            color: AppTheme.paperDim,
          )),
        ),
        child: NavigationBar(
          height: 64,
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book), label: '史册'),
            NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: '我的'),
          ],
        ),
      ),
    );
  }
}
