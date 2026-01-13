"""
Diff calculation engine for Watson.

Provides functions to compute token-level and structural diffs
between original LLM outputs and clinician-edited versions.
"""
import difflib
import json
import re
from typing import Any


def tokenize(text: str) -> list[str]:
    """
    Tokenize text into words and punctuation.

    Args:
        text: Input text to tokenize

    Returns:
        List of tokens (words and punctuation)
    """
    if not text:
        return []
    # Split on whitespace and punctuation, keeping punctuation as separate tokens
    tokens = re.findall(r'\w+|[^\w\s]', text, re.UNICODE)
    return tokens


def compute_token_diff(original: str, edited: str) -> dict:
    """
    Compute token-level diff between original and edited text.

    Uses difflib.SequenceMatcher to find differences at the token level.

    Args:
        original: Original text from LLM output
        edited: Edited text from clinician

    Returns:
        Dict containing:
        - operations: List of diff operations (equal, insert, delete, replace)
        - original_tokens: Original token list
        - edited_tokens: Edited token list
    """
    original_tokens = tokenize(original)
    edited_tokens = tokenize(edited)

    matcher = difflib.SequenceMatcher(None, original_tokens, edited_tokens)
    operations = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        op = {
            'operation': tag,
            'original_start': i1,
            'original_end': i2,
            'edited_start': j1,
            'edited_end': j2,
        }

        if tag == 'equal':
            op['tokens'] = original_tokens[i1:i2]
        elif tag == 'delete':
            op['deleted_tokens'] = original_tokens[i1:i2]
        elif tag == 'insert':
            op['inserted_tokens'] = edited_tokens[j1:j2]
        elif tag == 'replace':
            op['deleted_tokens'] = original_tokens[i1:i2]
            op['inserted_tokens'] = edited_tokens[j1:j2]

        operations.append(op)

    return {
        'operations': operations,
        'original_tokens': original_tokens,
        'edited_tokens': edited_tokens,
        'original_token_count': len(original_tokens),
        'edited_token_count': len(edited_tokens),
    }


def compute_structural_diff(original: Any, edited: Any, path: str = '') -> list[dict]:
    """
    Compute structural diff between two JSON objects.

    Recursively compares JSON structures and identifies additions,
    deletions, and modifications at each level.

    Args:
        original: Original JSON object
        edited: Edited JSON object
        path: Current JSON path (for nested structures)

    Returns:
        List of structural changes with paths and values
    """
    changes = []

    # Handle None cases
    if original is None and edited is None:
        return changes
    if original is None:
        changes.append({
            'path': path or '/',
            'operation': 'add',
            'value': edited,
        })
        return changes
    if edited is None:
        changes.append({
            'path': path or '/',
            'operation': 'delete',
            'old_value': original,
        })
        return changes

    # Different types
    if type(original) != type(edited):
        changes.append({
            'path': path or '/',
            'operation': 'replace',
            'old_value': original,
            'new_value': edited,
        })
        return changes

    # Compare dicts
    if isinstance(original, dict):
        all_keys = set(original.keys()) | set(edited.keys())
        for key in all_keys:
            new_path = f"{path}.{key}" if path else key
            if key not in original:
                changes.append({
                    'path': new_path,
                    'operation': 'add',
                    'value': edited[key],
                })
            elif key not in edited:
                changes.append({
                    'path': new_path,
                    'operation': 'delete',
                    'old_value': original[key],
                })
            else:
                changes.extend(compute_structural_diff(original[key], edited[key], new_path))

    # Compare lists
    elif isinstance(original, list):
        max_len = max(len(original), len(edited))
        for i in range(max_len):
            new_path = f"{path}[{i}]"
            if i >= len(original):
                changes.append({
                    'path': new_path,
                    'operation': 'add',
                    'value': edited[i],
                })
            elif i >= len(edited):
                changes.append({
                    'path': new_path,
                    'operation': 'delete',
                    'old_value': original[i],
                })
            else:
                changes.extend(compute_structural_diff(original[i], edited[i], new_path))

    # Compare primitives (strings, numbers, bools)
    elif original != edited:
        changes.append({
            'path': path or '/',
            'operation': 'modify',
            'old_value': original,
            'new_value': edited,
        })

    return changes


def compute_diff_stats(token_diff: dict, structural_diff: list[dict]) -> dict:
    """
    Compute statistics about the differences.

    Args:
        token_diff: Result from compute_token_diff()
        structural_diff: Result from compute_structural_diff()

    Returns:
        Dict containing:
        - token_additions: Number of tokens added
        - token_deletions: Number of tokens deleted
        - token_changes: Number of tokens changed (in replacements)
        - change_rate: Percentage of original tokens affected
        - structural_additions: Number of structural additions
        - structural_deletions: Number of structural deletions
        - structural_modifications: Number of structural modifications
    """
    token_additions = 0
    token_deletions = 0
    token_unchanged = 0

    for op in token_diff.get('operations', []):
        operation = op.get('operation')
        if operation == 'equal':
            token_unchanged += len(op.get('tokens', []))
        elif operation == 'delete':
            token_deletions += len(op.get('deleted_tokens', []))
        elif operation == 'insert':
            token_additions += len(op.get('inserted_tokens', []))
        elif operation == 'replace':
            token_deletions += len(op.get('deleted_tokens', []))
            token_additions += len(op.get('inserted_tokens', []))

    original_count = token_diff.get('original_token_count', 0)

    # Calculate change rate (tokens affected / original tokens)
    tokens_affected = token_deletions  # Deletions and replacements
    change_rate = (tokens_affected / original_count * 100) if original_count > 0 else 0

    # Structural stats
    structural_additions = sum(1 for c in structural_diff if c.get('operation') == 'add')
    structural_deletions = sum(1 for c in structural_diff if c.get('operation') == 'delete')
    structural_modifications = sum(1 for c in structural_diff if c.get('operation') in ('modify', 'replace'))

    return {
        'token_additions': token_additions,
        'token_deletions': token_deletions,
        'token_unchanged': token_unchanged,
        'change_rate': round(change_rate, 2),
        'original_token_count': original_count,
        'edited_token_count': token_diff.get('edited_token_count', 0),
        'structural_additions': structural_additions,
        'structural_deletions': structural_deletions,
        'structural_modifications': structural_modifications,
        'total_structural_changes': len(structural_diff),
    }


def compute_all_diffs(original_content: Any, edited_content: Any) -> tuple[dict, list[dict], dict]:
    """
    Compute all diffs for an edit submission.

    Handles both text and JSON content appropriately.

    Args:
        original_content: Original content (JSON object or dict with text)
        edited_content: Edited content (JSON object or dict with text)

    Returns:
        Tuple of (token_diff, structural_diff, diff_stats)
    """
    # Convert to JSON strings for token comparison if needed
    if isinstance(original_content, dict):
        original_text = json.dumps(original_content, indent=2, ensure_ascii=False)
    else:
        original_text = str(original_content)

    if isinstance(edited_content, dict):
        edited_text = json.dumps(edited_content, indent=2, ensure_ascii=False)
    else:
        edited_text = str(edited_content)

    # Compute diffs
    token_diff = compute_token_diff(original_text, edited_text)
    structural_diff = compute_structural_diff(original_content, edited_content)
    diff_stats = compute_diff_stats(token_diff, structural_diff)

    return token_diff, structural_diff, diff_stats
