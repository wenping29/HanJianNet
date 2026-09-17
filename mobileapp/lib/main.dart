import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/mine_screen.dart';
import 'screens/search_screen.dart';
import 'screens/traitor_form_screen.dart';
import 'services/locale_controller.dart';
import 'services/session.dart';
import 'services/theme_controller.dart';
import 'widgets/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocaleController.instance.load();
  await ThemeController.instance.load();
  runApp(const HanJianApp());
}

class HanJianApp extends StatelessWidget {
  const HanJianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Locale>(
      valueListenable: LocaleController.instance.locale,
      builder: (context, locale, _) {
        return ValueListenableBuilder<ThemeMode>(
          valueListenable: ThemeController.instance.mode,
          builder: (context, mode, _) {
            // 解析实际明暗并同步语义色，供组件中硬编码的 AppTheme.paper/ink 等使用
            final brightness = switch (mode) {
              ThemeMode.dark => Brightness.dark,
              ThemeMode.light => Brightness.light,
              _ => MediaQuery.platformBrightnessOf(context),
            };
            AppTheme.applyBrightness(brightness);
            return MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: AppTheme.light,
              darkTheme: AppTheme.dark,
              themeMode: mode,
              locale: locale,
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              supportedLocales: AppLocalizations.supportedLocales,
              onGenerateTitle: (ctx) => AppLocalizations.of(ctx)!.appTitle,
              home: const RootNav(),
            );
          },
        );
      },
    );
  }
}

/// 底部导航：首页 / 查询 / 提交新档案（动作项，跳转表单不占 tab）/ 我的。
class RootNav extends StatefulWidget {
  const RootNav({super.key});

  @override
  State<RootNav> createState() => _RootNavState();
}

class _RootNavState extends State<RootNav> {
  /// 页面索引：0 首页 / 1 查询 / 2 我的（提交新档案为动作项，不在其中）。
  int _index = 0;

  /// 点击「提交新档案」：未登录先跳登录页，登录成功后继续进入表单。
  Future<void> _openSubmitForm() async {
    if (!Session.instance.isLogin) {
      await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (!mounted || !Session.instance.isLogin) return;
    }
    if (!mounted) return;
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
          builder: (_) => const TraitorFormScreen(mode: TraitorFormMode.create)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [HomeScreen(), SearchScreen(), MineScreen()],
      ),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: AppTheme.inkCard,
          indicatorColor: AppTheme.cinnabar.withValues(alpha: 0.35),
          labelTextStyle: WidgetStatePropertyAll(
            TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              fontFamily: 'Noto Sans SC',
              color: AppTheme.paperDim,
            ),
          ),
        ),
        child: NavigationBar(
          height: 64,
          // 目的地索引：0 首页 / 1 查询 / 2 提交新档案（动作）/ 3 我的
          selectedIndex: _index >= 2 ? _index + 1 : _index,
          onDestinationSelected: (i) {
            if (i == 2) {
              _openSubmitForm();
              return;
            }
            setState(() => _index = i > 2 ? i - 1 : i);
          },
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: l10n.navHome,
            ),
            NavigationDestination(
              icon: const Icon(Icons.search_outlined),
              selectedIcon: const Icon(Icons.search),
              label: l10n.navSearch,
            ),
            NavigationDestination(
              icon: const Icon(Icons.add_circle_outline),
              selectedIcon: const Icon(Icons.add_circle),
              label: l10n.submitNewArchive,
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person),
              label: l10n.navMine,
            ),
          ],
        ),
      ),
    );
  }
}