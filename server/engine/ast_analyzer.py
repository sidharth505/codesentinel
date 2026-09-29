#!/usr/bin/env python3
"""
CodeSentinel AST Semantic Analysis Engine
Parses Python codebases, extracts AST structures, maps module coupling graphs,
detects silent exception suppression, duplication clusters, and architectural debt.
"""

import os
import sys
import ast
import json
import re
import hashlib
from collections import defaultdict
from typing import Dict, List, Set, Any, Tuple, Optional

IGNORE_DIRS = {
    '.git', '__pycache__', 'node_modules', 'venv', '.venv', 'env',
    '.pytest_cache', '.mypy_cache', 'dist', 'build', '.idea', '.vscode'
}

class ASTVisitor(ast.NodeVisitor):
    def __init__(self, filename: str, lines: List[str]):
        self.filename = filename
        self.lines = lines
        self.functions_count = 0
        self.classes_count = 0
        self.large_functions_count = 0
        self.exception_handlers_count = 0
        self.imports: Set[str] = set()
        self.import_locations: List[Dict[str, Any]] = []
        self.defined_symbols: Set[str] = set()
        self.defined_symbol_lines: Dict[str, int] = {}
        self.called_symbols: Set[str] = set()
        
        # Raw pattern findings
        self.silent_exceptions: List[Dict[str, Any]] = []
        self.missing_timeouts: List[Dict[str, Any]] = []
        self.insecure_configs: List[Dict[str, Any]] = []
        self.function_signatures: List[Dict[str, Any]] = []

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.functions_count += 1
        self.defined_symbols.add(node.name)
        self.defined_symbol_lines[node.name] = node.lineno
        
        # Check function length
        func_len = getattr(node, 'end_lineno', node.lineno) - node.lineno + 1
        if func_len > 40:
            self.large_functions_count += 1

        # Collect function signature & simplified body structure for duplication detection
        body_tokens = [type(stmt).__name__ for stmt in node.body]
        self.function_signatures.append({
            'name': node.name,
            'line': node.lineno,
            'file': self.filename,
            'token_hash': hashlib.md5("".join(body_tokens).encode()).hexdigest(),
            'arg_count': len(node.args.args)
        })

        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.functions_count += 1
        self.defined_symbols.add(node.name)
        self.defined_symbol_lines[node.name] = node.lineno
        func_len = getattr(node, 'end_lineno', node.lineno) - node.lineno + 1
        if func_len > 40:
            self.large_functions_count += 1
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        self.classes_count += 1
        self.defined_symbols.add(node.name)
        self.defined_symbol_lines[node.name] = node.lineno
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.add(alias.name)
            self.import_locations.append({
                'module': alias.name,
                'line': node.lineno,
                'preview': self._get_preview(node.lineno)
            })
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.level == 0 and node.module:
            imported_module = node.module
        elif node.level > 0:
            module_parts = os.path.splitext(self.filename.replace('\\', '/'))[0].split('/')
            package_parts = module_parts[:-1]
            package_parts = package_parts[:max(0, len(package_parts) - node.level + 1)]
            relative_parts = node.module.split('.') if node.module else []
            imported_module = '.'.join(package_parts + relative_parts)
        else:
            imported_module = ''

        if imported_module:
            self.imports.add(imported_module)
            self.import_locations.append({
                'module': imported_module,
                'line': node.lineno,
                'preview': self._get_preview(node.lineno)
            })
        elif node.level > 0:
            for alias in node.names:
                imported_module = '.'.join(package_parts + [alias.name])
                self.imports.add(imported_module)
                self.import_locations.append({
                    'module': imported_module,
                    'line': node.lineno,
                    'preview': self._get_preview(node.lineno)
                })
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Symbol calls
        if isinstance(node.func, ast.Name):
            self.called_symbols.add(node.func.id)
        elif isinstance(node.func, ast.Attribute):
            self.called_symbols.add(node.func.attr)

            # Check for HTTP requests missing timeout
            func_name = node.func.attr
            if func_name in ('get', 'post', 'put', 'delete', 'patch'):
                caller = ""
                if isinstance(node.func.value, ast.Name):
                    caller = node.func.value.id
                if caller in ('requests', 'http', 'client', 'session'):
                    has_timeout = any(kw.arg == 'timeout' for kw in node.keywords)
                    if not has_timeout:
                        preview = self._get_preview(node.lineno)
                        self.missing_timeouts.append({
                            'file': self.filename,
                            'line': node.lineno,
                            'preview': preview
                        })

            # Check for insecure environment fallback
            if func_name == 'getenv' and isinstance(node.func.value, ast.Name) and node.func.value.id == 'os':
                if len(node.args) >= 2 or any(kw.arg == 'default' for kw in node.keywords):
                    preview = self._get_preview(node.lineno)
                    if any(secret_term in preview.lower() for secret_term in ('secret', 'key', 'token', 'auth', 'pass')):
                        self.insecure_configs.append({
                            'file': self.filename,
                            'line': node.lineno,
                            'preview': preview
                        })

        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        self.exception_handlers_count += 1
        is_bare = node.type is None
        is_broad = False
        if node.type is not None:
            if isinstance(node.type, ast.Name) and node.type.id in ('Exception', 'BaseException'):
                is_broad = True
            elif isinstance(node.type, ast.Attribute) and node.type.attr in ('Exception', 'BaseException'):
                is_broad = True

        # Check if body silently swallows or merely passes
        is_silent = False
        if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
            is_silent = True
        elif len(node.body) == 1 and isinstance(node.body[0], ast.Return) and node.body[0].value is None:
            is_silent = True
        elif all(isinstance(stmt, (ast.Pass, ast.Expr)) for stmt in node.body):
            # If Expr is just print or docstring without raise
            has_raise = any(isinstance(stmt, ast.Raise) for stmt in node.body)
            if not has_raise:
                is_silent = True

        if (is_bare or is_broad) and is_silent:
            preview = self._get_preview(node.lineno)
            self.silent_exceptions.append({
                'file': self.filename,
                'line': node.lineno,
                'is_bare': is_bare,
                'is_broad': is_broad,
                'preview': preview
            })

        self.generic_visit(node)

    def _get_preview(self, lineno: int) -> str:
        if 1 <= lineno <= len(self.lines):
            return self.lines[lineno - 1].strip()
        return ""


def extract_code_snippet(root_dir: str, rel_file: str, target_line: int, window: int = 4) -> Dict[str, Any]:
    """Generates a structured CodeSnippet with highlighted line context."""
    full_path = os.path.join(root_dir, rel_file)
    if not os.path.exists(full_path):
        return {'file': rel_file, 'startLine': target_line, 'language': 'python', 'lines': []}

    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
            all_lines = f.readlines()
    except Exception:
        all_lines = []

    start = max(1, target_line - window)
    end = min(len(all_lines), target_line + window)

    snippet_lines = []
    for i in range(start, end + 1):
        line_code = all_lines[i - 1].rstrip('\n\r')
        is_highlighted = (i == target_line)
        reason = "Silent suppression / risk pattern detected" if is_highlighted else None
        snippet_lines.append({
            'lineNum': i,
            'code': line_code,
            'isHighlighted': is_highlighted,
            'highlightReason': reason
        })

    ext = os.path.splitext(rel_file)[1].lstrip('.')
    lang_map = {'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'go': 'go'}
    return {
        'file': rel_file,
        'startLine': start,
        'lines': snippet_lines,
        'language': lang_map.get(ext, 'python')
    }


def analyze_codebase(target_dir: str) -> Dict[str, Any]:
    target_dir = os.path.abspath(target_dir)
    
    python_files: List[str] = []
    all_source_files: List[str] = []

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.')]
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), target_dir)
            all_source_files.append(rel_path)
            if file.endswith('.py'):
                python_files.append(rel_path)

    total_functions = 0
    total_classes = 0
    total_large_functions = 0
    total_exception_handlers = 0

    all_silent_exceptions: List[Dict[str, Any]] = []
    all_missing_timeouts: List[Dict[str, Any]] = []
    all_insecure_configs: List[Dict[str, Any]] = []
    all_function_signatures: List[Dict[str, Any]] = []
    all_import_locations: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    
    file_imports: Dict[str, Set[str]] = defaultdict(set)
    defined_symbols: Dict[str, Tuple[str, int]] = {}
    called_symbols: Set[str] = set()

    for rel_path in python_files:
        full_path = os.path.join(target_dir, rel_path)
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            lines = content.splitlines()
            tree = ast.parse(content, filename=rel_path)
            visitor = ASTVisitor(rel_path, lines)
            visitor.visit(tree)

            total_functions += visitor.functions_count
            total_classes += visitor.classes_count
            total_large_functions += visitor.large_functions_count
            total_exception_handlers += visitor.exception_handlers_count

            all_silent_exceptions.extend(visitor.silent_exceptions)
            all_missing_timeouts.extend(visitor.missing_timeouts)
            all_insecure_configs.extend(visitor.insecure_configs)
            all_function_signatures.extend(visitor.function_signatures)
            
            # Module base name
            module_name = os.path.splitext(rel_path)[0].replace('/', '.')
            file_imports[module_name] = visitor.imports
            all_import_locations[rel_path].extend(visitor.import_locations)

            for sym in visitor.defined_symbols:
                defined_symbols[sym] = (rel_path, visitor.defined_symbol_lines[sym])
            called_symbols.update(visitor.called_symbols)

        except Exception as e:
            # Fallback regex parsing if AST parsing fails
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                for idx, line in enumerate(lines, start=1):
                    if re.search(r'except\s*(Exception)?:?\s*$', line.strip()):
                        all_silent_exceptions.append({
                            'file': rel_path,
                            'line': idx,
                            'is_bare': True,
                            'is_broad': True,
                            'preview': line.strip()
                        })
            except Exception:
                pass

    # 1. Duplication Analysis (Functions with identical token AST hash)
    hash_groups = defaultdict(list)
    for sig in all_function_signatures:
        hash_groups[sig['token_hash']].append(sig)

    duplicate_clusters = [group for group in hash_groups.values() if len(group) > 1 and group[0]['arg_count'] > 0]

    # 2. Dead Code / Ghost Scaffolding Analysis
    dead_symbols = []
    for sym, (file, line) in defined_symbols.items():
        if sym not in called_symbols and not sym.startswith('__') and not sym.startswith('test_'):
            dead_symbols.append({'symbol': sym, 'file': file, 'line': line})

    # 3. Module graph from resolvable local Python imports
    module_paths = {
        os.path.splitext(file)[0].replace('/', '.'): file
        for file in python_files
    }
    module_edges: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for source_module, imported_modules in file_imports.items():
        for imported_module in imported_modules:
            matches = [
                module for module in module_paths
                if imported_module == module
                or imported_module.startswith(module + '.')
                or module.startswith(imported_module + '.')
            ]
            if not matches:
                continue
            target_module = max(matches, key=len)
            if target_module == source_module:
                continue
            source_file = module_paths[source_module]
            import_location = next(
                (item for item in all_import_locations[source_file] if item['module'] == imported_module),
                None
            )
            if import_location:
                module_edges[(source_module, target_module)] = {
                    'line': import_location['line'],
                    'preview': import_location['preview']
                }

    edge_pairs = set(module_edges)
    arch_nodes: List[Dict[str, Any]] = []
    for index, (module, file) in enumerate(module_paths.items()):
        incoming = sum(1 for _, target in edge_pairs if target == module)
        outgoing = sum(1 for source, _ in edge_pairs if source == module)
        instability = round(outgoing / max(incoming + outgoing, 1), 2)
        level = 'high' if instability > 0.7 else ('medium' if instability > 0.4 else 'low')
        arch_nodes.append({
            'id': module,
            'name': file,
            'role': 'Python module',
            'type': 'service',
            'x': 80 + (index % 4) * 200,
            'y': 70 + (index // 4) * 100,
            'incomingCoupling': incoming,
            'outgoingCoupling': outgoing,
            'instabilityIndex': instability,
            'couplingLevel': level,
            'findingsCount': 0,
            'description': f"{incoming} local modules import this module; it imports {outgoing} local modules.",
            'relatedFindings': []
        })

    edges = [
        {
            'id': f'{source}->{target}',
            'source': source,
            'target': target,
            'isCoupledHigh': (target, source) in edge_pairs,
            'callFrequency': 'high' if (target, source) in edge_pairs else 'medium',
            'protocol': 'Python import'
        }
        for source, target in edge_pairs
    ]
    cyclic_edges = [edge for edge in edges if edge['isCoupledHigh']]

    # 4. Construct Findings Array
    findings: List[Dict[str, Any]] = []
    finding_id = 1

    # Finding 1: Silent Exception Suppression
    if all_silent_exceptions:
        sample_ev = all_silent_exceptions[0]
        snippet = extract_code_snippet(target_dir, sample_ev['file'], sample_ev['line'])
        findings.append({
            'id': f"find-{finding_id:03d}",
            'title': 'Silent Exception Suppression in Critical Paths',
            'category': 'error-handling',
            'categoryName': 'Error Handling',
            'severity': 'high',
            'description': f"{len(all_silent_exceptions)} exception handlers silently swallow errors or omit logging across system modules.",
            'whyItMatters': 'Broad exception handlers with no logging or re-raise can conceal failures and make operational diagnosis difficult.',
            'riskExplanation': 'A failed operation may appear successful to its caller while the underlying work did not complete.',
            'recommendation': 'Replace bare except blocks with explicit domain exception classes. Propagate or log every trapped exception with correlation IDs.',
            'evidence': [
                {'file': ev['file'], 'line': ev['line'], 'preview': ev['preview'] or 'except: pass'}
                for ev in all_silent_exceptions[:6]
            ],
            'snippet': snippet,
            'reviewed': False
        })
        finding_id += 1

    # Finding 2: Duplication in Business Logic
    if duplicate_clusters:
        sample_file = duplicate_clusters[0][0]['file']
        sample_line = duplicate_clusters[0][0]['line']
        snippet = extract_code_snippet(target_dir, sample_file, sample_line)
        findings.append({
            'id': f"find-{finding_id:03d}",
            'title': 'Repeated Function Structure',
            'category': 'code-duplication',
            'categoryName': 'Code Duplication',
            'severity': 'medium',
            'description': f"{len(duplicate_clusters)} groups of functions with identical statement structure were detected.",
            'whyItMatters': 'Identical function statement structures may indicate copied logic that can drift as code changes.',
            'riskExplanation': 'Identical statement shapes do not establish equivalent behavior or a security vulnerability.',
            'recommendation': 'Review each matching function pair and consolidate only where they implement the same responsibility.',
            'evidence': [
                {'file': sig['file'], 'line': sig['line'], 'preview': extract_code_snippet(target_dir, sig['file'], sig['line'], window=0)['lines'][0]['code']}
                for cluster in duplicate_clusters[:2]
                for sig in cluster[:2]
            ],
            'snippet': snippet,
            'reviewed': False
        })
        finding_id += 1

    # Finding 3: Architecture Circular Coupling
    if cyclic_edges:
        cycle = cyclic_edges[0]
        sample_file = module_paths[cycle['source']]
        reverse_file = module_paths[cycle['target']]
        cycle_line = module_edges[(cycle['source'], cycle['target'])]['line']
        snippet = extract_code_snippet(target_dir, sample_file, cycle_line)
        findings.append({
            'id': f"find-{finding_id:03d}",
            'title': 'Circular Module Imports',
            'category': 'architecture',
            'categoryName': 'Architecture',
            'severity': 'high',
            'description': f"Mutual imports were detected between {cycle['source']} and {cycle['target']}.",
            'whyItMatters': 'Mutual imports create strong coupling and can make modules difficult to initialize and test independently.',
            'riskExplanation': 'Import cycles can cause partially initialized modules or require import order workarounds.',
            'recommendation': 'Review the import cycle and move shared contracts to a dependency-neutral module where practical.',
            'evidence': [
                {'file': sample_file, 'line': cycle_line, 'preview': module_edges[(cycle['source'], cycle['target'])]['preview']},
                {'file': reverse_file, 'line': module_edges[(cycle['target'], cycle['source'])]['line'], 'preview': module_edges[(cycle['target'], cycle['source'])]['preview']}
            ],
            'snippet': snippet,
            'reviewed': False
        })
        finding_id += 1

    # Finding 4: Ghost Scaffolding & Dead Code
    if dead_symbols:
        sample_file = dead_symbols[0]['file']
        snippet = extract_code_snippet(target_dir, sample_file, dead_symbols[0]['line'])
        findings.append({
            'id': f"find-{finding_id:03d}",
            'title': 'Unreferenced Python Symbols',
            'category': 'boilerplate',
            'categoryName': 'Unreferenced Symbols',
            'severity': 'medium',
            'description': f"{len(dead_symbols)} defined symbols have no direct call references found in the analyzed Python files.",
            'whyItMatters': 'Symbols without direct references may be unused, although entry points and dynamically referenced names can be missed by static analysis.',
            'riskExplanation': 'Removing a symbol that is loaded dynamically or used externally could break callers, so verify references beyond this codebase before removal.',
            'recommendation': 'Prune unreferenced helper functions with automated reachability analysis.',
            'evidence': [
                {'file': sym['file'], 'line': sym['line'], 'preview': extract_code_snippet(target_dir, sym['file'], sym['line'], window=0)['lines'][0]['code']}
                for sym in dead_symbols[:4]
            ],
            'snippet': snippet,
            'reviewed': False
        })
        finding_id += 1

    # Finding 5: Missing HTTP Timeouts & Unbound Connections
    if all_missing_timeouts:
        sample_ev = all_missing_timeouts[0]
        snippet = extract_code_snippet(target_dir, sample_ev['file'], sample_ev['line'])
        findings.append({
            'id': f"find-{finding_id:03d}",
            'title': 'Missing HTTP Socket Timeouts',
            'category': 'dependencies',
            'categoryName': 'Dependency Complexity',
            'severity': 'medium',
            'description': 'Outbound HTTP client calls executed without explicit connection or socket read timeouts.',
            'whyItMatters': 'Without explicit timeouts, a stalled remote service may keep this request waiting longer than intended.',
            'riskExplanation': 'Long-running outbound requests can consume application resources and delay dependent work.',
            'recommendation': 'Enforce default socket timeouts (e.g. `timeout=5.0`) on all outbound requests and configure retry backoff.',
            'evidence': [
                {'file': sample_ev['file'], 'line': sample_ev['line'], 'preview': sample_ev['preview']}
            ],
            'snippet': snippet,
            'reviewed': False
        })
        finding_id += 1

    # Finding 6: Insecure Configuration Fallbacks
    if all_insecure_configs:
        sample_ev = all_insecure_configs[0]
        snippet = extract_code_snippet(target_dir, sample_ev['file'], sample_ev['line'])
        findings.append({
            'id': f"find-{finding_id:03d}",
            'title': 'Sensitive Environment Variable Default',
            'category': 'config',
            'categoryName': 'Configuration Hygiene',
            'severity': 'low',
            'description': 'A sensitive-looking environment variable uses an inline default value.',
            'whyItMatters': 'Inline defaults can hide missing configuration and may be inappropriate for a production environment.',
            'riskExplanation': 'The impact depends on the variable and how the application uses its fallback value.',
            'recommendation': 'Review the variable and fail startup when a required secret or credential is not configured.',
            'evidence': [
                {'file': sample_ev['file'], 'line': sample_ev['line'], 'preview': sample_ev['preview']}
            ],
            'snippet': snippet,
            'reviewed': False
        })
        finding_id += 1

    # 5. Score Calculation
    err_score = min(20, len(all_silent_exceptions) * 4)
    dup_score = min(20, len(duplicate_clusters) * 3)
    arch_score = min(20, len(cyclic_edges) * 4)
    boiler_score = min(15, len(dead_symbols) * 2)
    dep_score = min(10, len(all_missing_timeouts) * 3)
    config_score = min(15, len(all_insecure_configs) * 5)

    total_debt_score = err_score + dup_score + arch_score + boiler_score + dep_score + config_score
    severity_label = "HIGH RISK" if total_debt_score >= 65 else ("MEDIUM RISK" if total_debt_score >= 40 else "LOW RISK")
    overall_severity = "high" if total_debt_score >= 65 else ("medium" if total_debt_score >= 40 else "low")

    categories = [
        {
            'key': 'error-handling',
            'title': 'Error Handling',
            'score': err_score,
            'maxScore': 20,
            'severity': 'high' if err_score >= 14 else ('medium' if err_score >= 8 else 'low'),
            'explanation': next((f['description'] for f in findings if f['category'] == 'error-handling'), 'No matching findings.'),
            'findingsCount': len([f for f in findings if f['category'] == 'error-handling']),
            'icon': 'AlertTriangle'
        },
        {
            'key': 'code-duplication',
            'title': 'Code Duplication',
            'score': dup_score,
            'maxScore': 20,
            'severity': 'high' if dup_score >= 14 else ('medium' if dup_score >= 8 else 'low'),
            'explanation': next((f['description'] for f in findings if f['category'] == 'code-duplication'), 'No matching findings.'),
            'findingsCount': len([f for f in findings if f['category'] == 'code-duplication']),
            'icon': 'Copy'
        },
        {
            'key': 'architecture',
            'title': 'Architecture',
            'score': arch_score,
            'maxScore': 20,
            'severity': 'high' if arch_score >= 14 else ('medium' if arch_score >= 8 else 'low'),
            'explanation': next((f['description'] for f in findings if f['category'] == 'architecture'), 'No matching findings.'),
            'findingsCount': len([f for f in findings if f['category'] == 'architecture']),
            'icon': 'Network'
        },
        {
            'key': 'boilerplate',
            'title': 'Unreferenced Symbols',
            'score': boiler_score,
            'maxScore': 15,
            'severity': 'high' if boiler_score >= 10 else ('medium' if boiler_score >= 6 else 'low'),
            'explanation': next((f['description'] for f in findings if f['category'] == 'boilerplate'), 'No matching findings.'),
            'findingsCount': len([f for f in findings if f['category'] == 'boilerplate']),
            'icon': 'FileCode'
        },
        {
            'key': 'dependencies',
            'title': 'Dependency Complexity',
            'score': dep_score,
            'maxScore': 10,
            'severity': 'medium' if dep_score >= 6 else 'low',
            'explanation': next((f['description'] for f in findings if f['category'] == 'dependencies'), 'No matching findings.'),
            'findingsCount': len([f for f in findings if f['category'] == 'dependencies']),
            'icon': 'GitFork'
        },
        {
            'key': 'config',
            'title': 'Configuration Hygiene',
            'score': config_score,
            'maxScore': 15,
            'severity': 'medium' if config_score >= 8 else 'low',
            'explanation': next((f['description'] for f in findings if f['category'] == 'config'), 'No matching findings.'),
            'findingsCount': len([f for f in findings if f['category'] == 'config']),
            'icon': 'Sliders'
        }
    ]

    metrics = {
        'filesAnalyzed': len(python_files),
        'functions': total_functions,
        'classes': total_classes,
        'dependencies': len(set().union(*file_imports.values())),
        'duplicateClusters': len(duplicate_clusters),
        'exceptionHandlers': max(total_exception_handlers, len(all_silent_exceptions)),
        'largeFunctions': total_large_functions
    }

    return {
        'overallScore': {
            'debtScore': total_debt_score,
            'maxScore': 100,
            'severity': overall_severity,
            'severityLabel': severity_label,
            'patternCount': len(findings),
            'summary': f"{len(findings)} supported risk patterns detected." if findings else 'No supported risk patterns were detected by the current checks.'
        },
        'categories': categories,
        'findings': findings,
        'metrics': metrics,
        'architecture': {
            'nodes': arch_nodes,
            'edges': edges
        }
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Target directory required as argument'}))
        sys.exit(1)

    target_directory = sys.argv[1]
    if not os.path.isdir(target_directory):
        print(json.dumps({'error': f"Directory does not exist: {target_directory}"}))
        sys.exit(1)

    try:
        results = analyze_codebase(target_directory)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
