import re
import unicodedata
from collections import defaultdict


def normalize_text(text: str) -> str:
    """정규화: 공백/특수문자 제거, 소문자 변환"""
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"[^\w\s가-힣]", "", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def tokenize(text: str) -> set[str]:
    """한국어 텍스트를 토큰 집합으로 변환"""
    normalized = normalize_text(text)
    # 공백 분리 토큰
    words = set(normalized.split())
    # 바이그램 추가 (짧은 텍스트 유사도 보강)
    bigrams = set()
    for w in normalized.replace(" ", ""):
        for i in range(len(w) - 1):
            bigrams.add(w[i:i + 2])
    return words | bigrams


def jaccard_similarity(a: set, b: set) -> float:
    """Jaccard 유사도 계산"""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    intersection = len(a & b)
    union = len(a | b)
    return intersection / union


class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1

    def groups(self) -> dict[int, list[int]]:
        result = defaultdict(list)
        for i in range(len(self.parent)):
            result[self.find(i)].append(i)
        return dict(result)


def deduplicate(items: list[str]) -> list[str]:
    """정확 매칭 중복 제거 (정규화 기준)"""
    seen = {}
    result = []
    for item in items:
        key = normalize_text(item)
        if key not in seen:
            seen[key] = True
            result.append(item)
    return result


def group_similar(items: list[str], threshold: float = 0.35) -> list[list[str]]:
    """유사 항목 그룹핑 (Union-Find + Jaccard)"""
    if not items:
        return []

    # 중복 제거
    items = deduplicate(items)
    if len(items) <= 1:
        return [items]

    # 토큰화
    token_sets = [tokenize(item) for item in items]

    # Union-Find 클러스터링
    uf = UnionFind(len(items))
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            sim = jaccard_similarity(token_sets[i], token_sets[j])
            if sim >= threshold:
                uf.union(i, j)

    # 그룹 추출
    groups = uf.groups()
    return [[items[idx] for idx in indices] for indices in groups.values()]


def merge_group(group: list[str]) -> str:
    """그룹 내 항목을 하나로 병합"""
    if len(group) == 1:
        return group[0]

    # 가장 긴 항목을 베이스로
    base = max(group, key=len)
    base_tokens = tokenize(base)

    # 다른 항목의 고유 단어 수집
    extra_words = set()
    for item in group:
        if item == base:
            continue
        item_tokens = set(normalize_text(item).split())
        base_words = set(normalize_text(base).split())
        unique = item_tokens - base_words
        extra_words.update(unique)

    if extra_words:
        return f"{base} ({', '.join(extra_words)})"
    return base


def process_items(items_by_key: dict[tuple, list[str]], threshold: float = 0.35) -> dict[tuple, list[str]]:
    """
    전체 처리 파이프라인
    items_by_key: {(stage_id, category): [text1, text2, ...]}
    반환: {(stage_id, category): [merged_text1, merged_text2, ...]}
    """
    result = {}
    for key, texts in items_by_key.items():
        groups = group_similar(texts, threshold)
        merged = [merge_group(g) for g in groups]
        result[key] = merged
    return result
