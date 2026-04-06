# -*- coding: utf-8 -*-
"""
freetools 微信小程序自动化审计脚本
覆盖微信开发者工具审计报告中的关键检查项

用法: python audit.py [--json] [--fix]

检查项:
1. :active 伪类残留（体验）
2. input placeholder 对比度（体验）
3. WXML 节点数超限 >1000（性能）
4. setData 频率（性能）- 检查 slider-changing/input 事件是否节流
5. setData 传入未绑定变量（最佳实践）
6. wxss 未使用样式（最佳实践）
7. <text> 组件 hover-class 检查（最佳实践）
8. UI 可见元素超出屏幕（用户体验）

--json: 输出 JSON 格式（便于 CI 集成）
--fix: 自动修复可安全修复的问题
"""

import os
import re
import sys
import json
import argparse
from collections import defaultdict

# 修复 Windows PowerShell GBK 编码问题
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ============================================================
# 配置
# ============================================================
# audit.py 在 docs 目录下，所以需要返回上一级
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGES_DIR = os.path.join(BASE_DIR, 'packages')
PAGES_DIR = os.path.join(BASE_DIR, 'pages')
COMPONENTS_DIR = os.path.join(BASE_DIR, 'components')

SCAN_DIRS = [PACKAGES_DIR, PAGES_DIR, COMPONENTS_DIR]

ALL_WXML_FILES = []
ALL_JS_FILES = []
ALL_WXSS_FILES = []

IGNORE_DIRS = {'node_modules', '.git', 'miniprogram_npm'}


def find_files():
    global ALL_WXML_FILES, ALL_JS_FILES, ALL_WXSS_FILES
    for scan_dir in SCAN_DIRS:
        if not os.path.exists(scan_dir):
            continue
        for root, dirs, files in os.walk(scan_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                fp = os.path.join(root, f)
                if f.endswith('.wxml'):
                    ALL_WXML_FILES.append(fp)
                elif f.endswith('.js'):
                    ALL_JS_FILES.append(fp)
                elif f.endswith('.wxss'):
                    ALL_WXSS_FILES.append(fp)


def read_file(fp):
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return ''


def get_wxml_for_wxss(wxss_path):
    base = os.path.join(BASE_DIR, 'packages')
    if not wxss_path.startswith(base):
        return []
    rel = os.path.relpath(wxss_path, base)
    wxml_rel = rel.replace('.wxss', '.wxml')
    wxml_path = os.path.join(base, wxml_rel)
    return [wxml_path] if os.path.exists(wxml_path) else []


def get_all_wxml_classes(wxml_paths):
    classes = set()
    for wp in wxml_paths:
        content = read_file(wp)
        classes.update(re.findall(r'class="([^"]*)"', content))
        for match in re.findall(r':class="([^"]*)"', content):
            classes.update(re.findall(r"'([^']*)'", match))
    result = set()
    for cls_group in classes:
        for c in cls_group.split():
            if c:
                result.add(c)
    return result


# ============================================================
# 检查项 1: :active 伪类残留
# ============================================================
def check_active_pseudo():
    issues = []
    for wxss in ALL_WXSS_FILES:
        content = read_file(wxss)
        if ':active' in content:
            matches = re.findall(r'([^{]+):active\s*\{', content)
            for m in matches:
                rel = os.path.relpath(wxss, BASE_DIR)
                issues.append({
                    'file': rel,
                    'rule': m.strip(),
                    'detail': f'{rel}: {m.strip()}:active'
                })
    return {
        'id': 'active_pseudo',
        'title': ':active 伪类残留',
        'category': '体验',
        'severity': 'warning',
        'pass': len(issues) == 0,
        'issues': issues,
        'summary': f'{len(issues)} 处 :active 伪类残留'
    }


# ============================================================
# 检查项 2: input placeholder 对比度
# ============================================================
def check_placeholder_contrast():
    app_wxss = read_file(os.path.join(BASE_DIR, 'app.wxss'))
    has_global = 'input-placeholder' in app_wxss

    missing = []
    for wxml in ALL_WXML_FILES:
        content = read_file(wxml)
        inputs = re.findall(r'<input\b[^>]*>', content)
        for inp in inputs:
            if 'placeholder' in inp and 'placeholder-class' not in inp and 'placeholder-style' not in inp:
                rel = os.path.relpath(wxml, BASE_DIR)
                missing.append({'file': rel, 'detail': f'{rel}: <input> 缺少 placeholder-class/placeholder-style'})

    return {
        'id': 'placeholder_contrast',
        'title': 'input placeholder 对比度',
        'category': '体验',
        'severity': 'info',
        'pass': len(missing) == 0,
        'issues': missing,
        'summary': f'全局样式: {"已配置" if has_global else "未配置"}, {len(missing)} 个 input 缺少 placeholder-class'
    }


# ============================================================
# 检查项 3: WXML 节点数
# ============================================================
def check_wxml_nodes():
    issues = []
    for wxml in ALL_WXML_FILES:
        content = read_file(wxml)
        tags = re.findall(r'<(?!\/)(?!!--)(?!input)(?!text)\w+\b', content)
        input_count = len(re.findall(r'<input\b', content))
        text_count = len(re.findall(r'<text\b', content))
        total = len(tags) + input_count + text_count

        if total > 800:
            rel = os.path.relpath(wxml, BASE_DIR)
            issues.append({
                'file': rel,
                'count': total,
                'detail': f'{rel}: 约 {total} 个节点 (阈值 1000)'
            })

    return {
        'id': 'wxml_nodes',
        'title': 'WXML 节点数',
        'category': '性能',
        'severity': 'warning',
        'pass': all(i['count'] <= 1000 for i in issues),
        'issues': issues,
        'summary': f'{len(issues)} 个文件节点数较多'
    }


# ============================================================
# 检查项 4: setData 频率
# ============================================================
def check_setdata_frequency():
    issues = []
    for js in ALL_JS_FILES:
        content = read_file(js)
        # 检查高频事件处理函数（changing, input）
        handlers = re.findall(r'(?:on|handle)\w*[Cc]hanging\s*\(|(?:on|handle)\w*[Ii]nput\s*\(', content)
        if not handlers:
            # 也检查 bindchanging/bindinput
            handlers = re.findall(r'bind(?:changing|input)\s*=\s*"(\w+)"', content)

        if handlers:
            has_throttle = any(kw in content for kw in [
                'throttle', 'lastUpdate', '_last', 'setTimeout', 'debounce',
                'requestAnimationFrame', 'nextTick'
            ])
            if not has_throttle:
                rel = os.path.relpath(js, BASE_DIR)
                issues.append({
                    'file': rel,
                    'detail': f'{rel}: 高频事件处理器可能缺少节流'
                })

    return {
        'id': 'setdata_frequency',
        'title': 'setData 频率',
        'category': '性能',
        'severity': 'warning',
        'pass': len(issues) == 0,
        'issues': issues,
        'summary': f'{len(issues)} 个文件可能有高频 setData'
    }


# ============================================================
# 检查项 5: setData 未绑定变量
# ============================================================
def check_setdata_unbound():
    issues = []
    # 常见不需要检查的变量名（UI 状态、事件处理相关）
    SKIP_VARS = {
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'loading', 'show', 'visible', 'hidden', 'active', 'disabled',
        'checked', 'selected', 'current', 'index', 'type', 'status',
        'animation', 'scrollTop', 'scrollLeft',
    }

    for js in ALL_JS_FILES:
        wxml_path = js.replace('.js', '.wxml')
        if not os.path.exists(wxml_path):
            continue

        js_content = read_file(js)
        wxml_content = read_file(wxml_path)

        # 更精确的 setData 提取：匹配单层 setData 调用
        # 排除嵌套对象属性如 { obj: { prop: val } }
        setdata_blocks = re.findall(
            r'this\.setData\(\s*\{([^}]{1,200})\}\s*\)',
            js_content
        )
        if not setdata_blocks:
            continue

        reported_vars = set()

        for sd_block in setdata_blocks:
            # 提取顶层变量名（不含点号的属性）
            vars_found = re.findall(r'(\w+)\s*:', sd_block)
            for var in vars_found:
                # 过滤
                if not var or var[0].isdigit() or var.startswith('_'):
                    continue
                if var in SKIP_VARS:
                    continue
                if len(var) < 2:
                    continue

                key = f'{os.path.relpath(js, BASE_DIR)}:{var}'
                if key in reported_vars:
                    continue
                reported_vars.add(key)

                # 在 wxml 中搜索使用
                patterns = [
                    r'\{\{\s*' + re.escape(var) + r'(?:\b|\s|\.)',
                    r'\{\{\s*\.\.\.' + re.escape(var) + r'(?:\b|\s)',
                    r'data-\w+="[^"]*\{\{\s*' + re.escape(var),
                ]
                used = any(re.search(p, wxml_content) for p in patterns)

                if not used:
                    # 二次确认：检查是否通过 WXS 或组件传递
                    # 检查 JS 中是否有 this.data.var 引用
                    data_refs = len(re.findall(
                        r'this\.data\.' + re.escape(var) + r'\b',
                        js_content
                    ))
                    rel = os.path.relpath(js, BASE_DIR)
                    if data_refs > 0:
                        issues.append({
                            'file': rel,
                            'var': var,
                            'type': 'instance',
                            'refs': data_refs,
                            'detail': f'{rel}: setData "{var}" not in WXML, {data_refs} JS refs (use instance attr)'
                        })
                    else:
                        issues.append({
                            'file': rel,
                            'var': var,
                            'type': 'delete',
                            'refs': 0,
                            'detail': f'{rel}: setData "{var}" unused (safe to remove)'
                        })

    return {
        'id': 'setdata_unbound',
        'title': 'setData unbound vars',
        'category': 'best-practice',
        'severity': 'info',
        'pass': len(issues) == 0,
        'issues': issues,
        'summary': f'{len(issues)} unbound vars'
    }


# ============================================================
# 检查项 6: wxss 未使用样式
# ============================================================
def check_unused_wxss():
    issues = []

    for wxss in ALL_WXSS_FILES:
        wxml_paths = get_wxml_for_wxss(wxss)
        if not wxml_paths:
            continue

        wxss_content = read_file(wxss)
        wxml_classes = get_all_wxml_classes(wxml_paths)
        wxss_classes = re.findall(r'\.([a-zA-Z_][\w-]*)', wxss_content)

        skip_classes = {
            'hover', 'active', 'before', 'after', 'focus', 'placeholder',
            'placeholder-class', 'input-placeholder', 'wxss', 'json',
            'node', 'disabled', 'checked', 'selected', 'first-child',
            'last-child', 'nth-child', 'not', 'root', 'empty',
            'keyframes', 'webkit', 'moz', 'ms', 'o',
        }

        unused = []
        for cls in set(wxss_classes):
            if cls in skip_classes or cls.startswith('keyframes') or cls.startswith('-'):
                continue
            if any(c.isdigit() and len(cls) <= 2 for c in cls):
                continue
            if cls not in wxml_classes:
                js_path = wxss.replace('.wxss', '.js')
                js_content = read_file(js_path)
                if cls in js_content:
                    continue
                unused.append(cls)

        if unused:
            rel = os.path.relpath(wxss, BASE_DIR)
            lines = wxss_content.split('\n')
            unused_size = 0
            for line in lines:
                if any(u in line for u in unused):
                    unused_size += len(line) + 1

            if unused_size > 500:
                issues.append({
                    'file': rel,
                    'classes': sorted(unused),
                    'size_bytes': unused_size,
                    'detail': f'{rel}: {len(unused)} 个未使用 class ({unused_size}B)'
                })

    return {
        'id': 'unused_wxss',
        'title': 'wxss 未使用样式',
        'category': '最佳实践',
        'severity': 'info',
        'pass': len(issues) == 0,
        'issues': issues,
        'summary': f'{len(issues)} 个文件有未使用样式'
    }


# ============================================================
# 检查项 7: <text> 组件 hover-class
# ============================================================
def check_text_hover():
    issues = []
    for wxml in ALL_WXML_FILES:
        content = read_file(wxml)
        matches = re.findall(r'<text\b[^>]*hover-class[^>]*>', content)
        if matches:
            rel = os.path.relpath(wxml, BASE_DIR)
            for m in matches:
                issues.append({
                    'file': rel,
                    'detail': f'{rel}: <text> 不支持 hover-class'
                })
    return {
        'id': 'text_hover_class',
        'title': '<text> 组件 hover-class',
        'category': '最佳实践',
        'severity': 'info',
        'pass': len(issues) == 0,
        'issues': issues,
        'summary': f'{len(issues)} 处 <text> 误用 hover-class'
    }


# ============================================================
# 检查项 8: UI 可见元素超出屏幕
# ============================================================
def check_ui_overflow_screen():
    """
    检查可能导致UI元素超出屏幕的样式问题：
    1. 固定定位 (fixed) 配合负 margin 或过大的 right/bottom
    2. 绝对定位 (absolute) 配合可能导致超出屏幕的 left/right/top/bottom
    3. width/height 使用百分比且父容器未设置明确尺寸
    4. 使用 transform translate 偏移
    5. z-index 过高导致被裁剪
    """
    issues = []

    for wxss in ALL_WXSS_FILES:
        wxss_content = read_file(wxss)
        if not wxss_content:
            continue

        rel = os.path.relpath(wxss, BASE_DIR)

        # 提取所有样式规则
        rule_pattern = r'([^{]+)\s*\{([^}]*)\}'
        rules = re.findall(rule_pattern, wxss_content)

        for selector, props in rules:
            selector = selector.strip()
            props = props.strip()

            # 跳过全局样式、伪元素、媒体查询等
            if any(x in selector for x in ['@media', '@supports', '@keyframes', 'page::', '::before', '::after']):
                continue

            # 检查属性值
            check_rule_for_overflow(rel, selector, props, issues)

    return {
        'id': 'ui_overflow_screen',
        'title': 'UI 可见元素超出屏幕',
        'category': '用户体验',
        'severity': 'warning',
        'pass': len(issues) == 0,
        'issues': issues,
        'summary': f'{len(issues)} 处可能超出屏幕的样式'
    }


def check_rule_for_overflow(file, selector, props, issues):
    """
    检查单个规则是否可能导致元素超出屏幕
    """
    # 提取所有属性
    prop_dict = {}
    for line in props.split(';'):
        line = line.strip()
        if ':' in line:
            key, val = line.split(':', 1)
            prop_dict[key.strip().lower()] = val.strip()

    # 跳过没有定位属性的规则
    position = prop_dict.get('position', '')
    if position not in ['fixed', 'absolute']:
        return

    # 跳过滚动容器样式（scroll-view 内的定位不算超出屏幕）
    if 'overflow' in prop_dict or 'overflow-x' in prop_dict or 'overflow-y' in prop_dict:
        return

    # 获取尺寸和位置属性
    left = prop_dict.get('left', '')
    right = prop_dict.get('right', '')
    top = prop_dict.get('top', '')
    bottom = prop_dict.get('bottom', '')
    width = prop_dict.get('width', '')
    height = prop_dict.get('height', '')
    margin_left = prop_dict.get('margin-left', '')
    margin_right = prop_dict.get('margin-right', '')
    margin_top = prop_dict.get('margin-top', '')
    margin_bottom = prop_dict.get('margin-bottom', '')
    transform = prop_dict.get('transform', '')
    z_index = prop_dict.get('z-index', '')

    problems = []

    # 判断是否是全屏遮罩/遮罩层（这些是正常的）
    is_full_screen_mask = (
        position == 'absolute' and
        left == '0' and right == '0' and top == '0' and bottom == '0' and
        ('mask' in selector.lower() or 'overlay' in selector.lower() or
         'loading' in selector.lower() or 'modal' in selector.lower())
    )
    if is_full_screen_mask:
        return  # 全屏遮罩是正常的，不报告问题

    # 1. 检查固定定位配合负边距（fixed定位相对视口，负margin可能真的超出）
    if position == 'fixed':
        # 只报告严重的负margin（小于-50rpx或-25px）
        for margin_name, margin_val in [('left', margin_left), ('right', margin_right),
                                         ('top', margin_top), ('bottom', margin_bottom)]:
            if margin_val and margin_val.startswith('-'):
                try:
                    val_num = float(margin_val.replace('rpx', '').replace('px', '').replace('-', ''))
                    if 'rpx' in margin_val and val_num > 50:
                        problems.append(f'fixed + margin-{margin_name}: {margin_val} (较大负值)')
                    elif 'px' in margin_val and val_num > 25:
                        problems.append(f'fixed + margin-{margin_name}: {margin_val} (较大负值)')
                except:
                    pass

        # 检查过大的 right/bottom 值（可能导致超出右下角）
        if right:
            try:
                right_val = float(right.replace('rpx', '').replace('px', '').replace('vw', '').replace('vh', ''))
                if right_val > 400:  # 调整阈值：400rpx约等于屏幕一半
                    problems.append(f'right={right} 较大值')
            except:
                pass

        if bottom:
            try:
                bottom_val = float(bottom.replace('rpx', '').replace('px', '').replace('vw', '').replace('vh', ''))
                if bottom_val > 400:
                    problems.append(f'bottom={bottom} 较大值')
            except:
                pass

    # 2. 检查绝对定位配合可疑的值
    if position == 'absolute':
        # 检查是否同时使用 left 和 right 且宽度过大（除非是全屏遮罩）
        if left == '0' and right == '0' and top == '0' and bottom == '0':
            return  # 已经在全屏遮罩判断中处理了

        # 排除按钮光效、滑块等常见模式（left:0; right:0 且 transform 常用于居中/全宽）
        if left == '0' and right == '0' and (transform or width):
            return  # 常见于滑块、按钮装饰元素等

        if left and right and not width:
            # 检查z-index，高z-index可能是遮罩层
            if z_index and int(z_index) > 900:
                return  # 高z-index的可能是遮罩层
            problems.append(f'absolute + left+right（注意宽度）')

        # 检查严重的负值定位（绝对定位的负值可能被父元素裁剪，但需要警惕）
        for pos_name, pos_val in [('left', left), ('right', right), ('top', top), ('bottom', bottom)]:
            if pos_val and pos_val.startswith('-'):
                try:
                    val_num = float(pos_val.replace('rpx', '').replace('px', '').replace('-', ''))
                    # 只报告较大的负值
                    if 'rpx' in pos_val and val_num > 100:
                        problems.append(f'absolute + {pos_name}: {pos_val}')
                    elif 'px' in pos_val and val_num > 50:
                        problems.append(f'absolute + {pos_name}: {pos_val}')
                except:
                    pass

    # 3. 检查极端的百分比宽度
    if width and width.endswith('%'):
        try:
            width_pct = float(width.rstrip('%'))

            # 排除按钮光效（shine）元素 - 通常配合 position: absolute + transform: rotate()
            if position == 'absolute' and 'shine' in selector.lower() and width_pct == 200:
                return  # 按钮光效是正常的

            if width_pct > 105:  # 超过105%报告
                problems.append(f'width={width} 超过105%')
        except:
            pass

    # 4. 检查 transform 偏移（translate负值常用于居中，只报告极端情况）
    if transform:
        # translateY(-50%) 常用于垂直居中，不报告
        if 'translateY' in transform and '-50%' in transform and 'translateX' not in transform:
            pass
        elif 'translateY' in transform and '-' in transform and '-50%' not in transform:
            try:
                # 提取偏移值
                match = re.search(r'translateY\(([^)]+)\)', transform)
                if match:
                    val = match.group(1)
                    val_num = float(val.replace('rpx', '').replace('px', '').replace('-', ''))
                    if 'rpx' in val and val_num > 100:
                        problems.append(f'transform translateY: {val}')
                    elif 'px' in val and val_num > 50:
                        problems.append(f'transform translateY: {val}')
            except:
                pass
        elif 'translateX' in transform and '-' in transform:
            try:
                match = re.search(r'translateX\(([^)]+)\)', transform)
                if match:
                    val = match.group(1)
                    val_num = float(val.replace('rpx', '').replace('px', '').replace('-', ''))
                    if 'rpx' in val and val_num > 100:
                        problems.append(f'transform translateX: {val}')
                    elif 'px' in val and val_num > 50:
                        problems.append(f'transform translateX: {val}')
            except:
                pass

    # 如果发现问题，添加到 issues
    if problems:
        issues.append({
            'file': file,
            'selector': selector,
            'position': position,
            'problems': problems,
            'props': props,
            'detail': f'{file}: {selector} - {", ".join(problems)}'
        })


# ============================================================
# 主程序
# ============================================================
def run_audit():
    find_files()
    checks = [
        check_active_pseudo(),
        check_placeholder_contrast(),
        check_wxml_nodes(),
        check_setdata_frequency(),
        check_setdata_unbound(),
        check_unused_wxss(),
        check_text_hover(),
        check_ui_overflow_screen(),
    ]

    total = len(checks)
    passed = sum(1 for c in checks if c['pass'])
    score = int((passed / total) * 100) if total > 0 else 100

    return {
        'project': 'freetools',
        'score': score,
        'passed': passed,
        'total': total,
        'checks': checks
    }


def print_report(result, json_output=False):
    if json_output:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    score = result['score']
    icon = '[PASS]' if score >= 80 else '[WARN]' if score >= 60 else '[FAIL]'

    lines = []
    lines.append(f'{icon} freetools audit report')
    lines.append(f'  Score: {score}/100 ({result["passed"]}/{result["total"]} passed)')
    lines.append('')

    categories = defaultdict(list)
    for check in result['checks']:
        categories[check['category']].append(check)

    for cat, checks in categories.items():
        cat_passed = sum(1 for c in checks if c['pass'])
        cat_icon = '[OK]' if cat_passed == len(checks) else '[!!]'
        lines.append(f'{cat_icon} {cat} ({cat_passed}/{len(checks)} passed)')
        for check in checks:
            c_icon = '  [v]' if check['pass'] else '  [x]'
            lines.append(f'{c_icon} {check["title"]}: {check["summary"]}')
            for issue in check['issues']:
                lines.append(f'      - {issue["detail"]}')
        lines.append('')

    lines.append('-' * 50)
    if score == 100:
        lines.append('All checks passed!')
    else:
        lines.append(f'{result["total"] - result["passed"]} issues need attention.')

    print('\n'.join(lines))


def auto_fix(result):
    fixed = []

    for check in result['checks']:
        if check['id'] == 'placeholder_contrast' and not check['pass']:
            for issue in check['issues']:
                fp = os.path.join(BASE_DIR, issue['file'])
                content = read_file(fp)
                if not content:
                    continue

                def add_ph(m):
                    tag = m.group(0)
                    if 'placeholder-class' in tag or 'placeholder-style' in tag:
                        return tag
                    if tag.endswith('/>'):
                        return tag[:-2] + ' placeholder-class="input-placeholder"/>'
                    elif tag.endswith('>'):
                        return tag[:-1] + ' placeholder-class="input-placeholder">'
                    return tag

                new_content = re.sub(r'<input\b[^>]*>', add_ph, content)
                if new_content != content:
                    with open(fp, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    fixed.append(issue['file'])

        if check['id'] == 'text_hover_class' and not check['pass']:
            for issue in check['issues']:
                fp = os.path.join(BASE_DIR, issue['file'])
                content = read_file(fp)
                if not content:
                    continue
                new_content = re.sub(
                    r'(<text\b[^>]*?)\s*hover-class="[^"]*"',
                    r'\1',
                    content
                )
                new_content = re.sub(r'(<text\b[^>]*?)\s+>', r'\1>', new_content)
                if new_content != content:
                    with open(fp, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    fixed.append(issue['file'])

    return list(set(fixed))


def main():
    parser = argparse.ArgumentParser(description='freetools audit')
    parser.add_argument('--json', action='store_true', help='JSON output')
    parser.add_argument('--fix', action='store_true', help='Auto-fix safe issues')
    args = parser.parse_args()

    print('Auditing freetools...')
    result = run_audit()

    print(f'  WXML: {len(ALL_WXML_FILES)}, JS: {len(ALL_JS_FILES)}, WXSS: {len(ALL_WXSS_FILES)}')
    print()

    if args.fix:
        print('Auto-fixing...')
        fixed_files = auto_fix(result)
        if fixed_files:
            print(f'  Fixed {len(fixed_files)} files:')
            for f in sorted(fixed_files):
                print(f'    - {f}')
            print()
            print('Re-auditing...')
            result = run_audit()
            print()

    print_report(result, json_output=args.json)


if __name__ == '__main__':
    main()
