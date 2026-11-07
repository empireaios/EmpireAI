"""Bounded static Flight/HTML comparison under a complete webpack graph proof.

Package Javascript is never evaluated. Numbers are transformed only in typed
Flight import module/chunk operands; all other data remains semantically exact.
"""
import functools
import hashlib
import json
import os
import pathlib
import re
import stat
import urllib.parse

MAX_BYTES = 16 * 1024 * 1024
MAX_RECORDS = 100000
HEX = re.compile(r"[0-9a-f]{64}\Z")
DECIMAL = re.compile(r"(?:0|[1-9][0-9]{0,15})\Z")
RECORD = re.compile(r"([0-9a-f]*):(.*)\Z", re.DOTALL)
SCRIPT = re.compile(r"(<script(?:\s[^>]*)?>)(.*?)(</script\s*>)", re.DOTALL)
PUSH = re.compile(r"self\.__next_f\.push\((\[.*\])\);?\Z", re.DOTALL)
_CONTEXT_CACHE = {}
WITNESS_INDEX_SHA256 = "17a6c18c85b5010ae50026422afd0e0dc1b5f79afc9864b05896fecbe924780e"


class Refusal(ValueError):
    pass


def require(ok, code):
    if not ok:
        raise Refusal(code)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def _json(data):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, "DUPLICATE_JSON_KEY")
            result[key] = value
        return result
    def constant(_):
        raise Refusal("NONFINITE_JSON_NUMBER")
    return json.loads(data, object_pairs_hook=pairs, parse_constant=constant)


def _canonical(data):
    # Object order is retained: unlike manifest lookup tables, arbitrary Flight
    # model objects are not granted an order-insensitivity waiver.
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()


def _id(value):
    require(type(value) in (str, int), "TYPED_MODULE_ID_REQUIRED")
    text = str(value)
    require(DECIMAL.fullmatch(text) is not None and int(text) <= 9007199254740991,
            "CANONICAL_BOUNDED_MODULE_ID_REQUIRED")
    return text


def _path(value):
    require(isinstance(value, str) and value and len(value) <= 1024,
            "CANONICAL_RELATIVE_PATH_REQUIRED")
    p = pathlib.PurePosixPath(value)
    require(not p.is_absolute() and str(p) == value and ".." not in p.parts and "\\" not in value,
            "CANONICAL_RELATIVE_PATH_REQUIRED")
    return value


def _context(proof, old_id, new_id):
    require(isinstance(proof, dict), "JS_GRAPH_PROOF_REQUIRED")
    require(all(isinstance(x, str) and re.fullmatch(r"[A-Za-z0-9_-]{1,128}", x) for x in (old_id, new_id)),
            "EXACT_BUILD_IDS_REQUIRED")
    encoded = json.dumps(proof, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    require(len(encoded) <= 8 * 1024 * 1024, "JS_PROOF_BOUND")
    proof_sha = sha(encoded)
    cache_key = (proof_sha, old_id, new_id)
    if cache_key in _CONTEXT_CACHE:
        return _CONTEXT_CACHE[cache_key]
    require(proof.get("schema") == "work8-v84-q05-webpack-graph-proof-v1"
            and proof.get("status") == "PASS_GLOBAL_JS_GRAPH_AND_FULL_AST"
            and proof.get("graphIsomorphismProved") is True
            and proof.get("wholeFileASTEquality") is True
            and proof.get("globallyConsistentBijection") is True
            and proof.get("applicationExecuted") is False
            and proof.get("issues") == [] and proof.get("failures") == [],
            "COMPLETE_JS_GRAPH_PROOF_REQUIRED")
    require(HEX.fullmatch(str(proof.get("analyzerSHA256", ""))) is not None
            and HEX.fullmatch(str(proof.get("parserSHA256", ""))) is not None,
            "JS_PROOF_IMPLEMENTATION_BINDING_REQUIRED")
    mappings = proof.get("mapping")
    require(isinstance(mappings, list) and 0 < len(mappings) <= 32768, "JS_NODE_BOUND")
    mapping, reverse = {}, set()
    for row in mappings:
        require(isinstance(row, dict) and set(row) == {"old", "new"}, "JS_NODE_MAPPING_SHAPE")
        old, new = row["old"], row["new"]
        require(isinstance(old, str) and isinstance(new, str), "JS_NODE_MAPPING_SHAPE")
        a, b = old.split(":"), new.split(":")
        require(len(a) == len(b) == 3 and a[:2] == b[:2]
                and a[0] in ("server", "client") and a[1] in ("module", "chunk"),
                "JS_NODE_NAMESPACE_REQUIRED")
        _id(a[2]); _id(b[2])
        require(old not in mapping and new not in reverse, "JS_BIJECTION_REQUIRED")
        mapping[old] = new
        reverse.add(new)
    require(proof.get("modulesAndChunks") == {"old": len(mapping), "new": len(mapping)},
            "COMPLETE_JS_NODE_INVENTORY_REQUIRED")
    file_pairs = proof.get("filePairs")
    require(isinstance(file_pairs, list) and 0 < len(file_pairs) <= 4096,
            "COMPLETE_JS_FILE_PAIRS_REQUIRED")
    require(proof.get("files") == {"old": len(file_pairs), "new": len(file_pairs)},
            "COMPLETE_JS_FILE_INVENTORY_REQUIRED")
    old_paths, new_paths, replacements = set(), set(), {}
    for row in file_pairs:
        a, b = _path(row["oldPath"]), _path(row["newPath"])
        require(a.startswith("app/.next/") and b.startswith("app/.next/")
                and a.endswith(".js") and b.endswith(".js")
                and a not in old_paths and b not in new_paths and row.get("equal") is True,
                "JS_FILE_BIJECTION_REQUIRED")
        old_paths.add(a); new_paths.add(b)
        require(all(HEX.fullmatch(str(row.get(k, ""))) is not None
                    for k in ("oldSHA256", "newSHA256", "normalizedOldSHA256", "normalizedNewSHA256"))
                and row["normalizedOldSHA256"] == row["normalizedNewSHA256"],
                "EXACT_JS_FILE_COMPARISON_REQUIRED")
        if a != b and a.startswith("app/.next/static/") and b.startswith("app/.next/static/"):
            x, y = a.removeprefix("app/.next/"), b.removeprefix("app/.next/")
            for x1, y1 in ((x, y), (urllib.parse.quote(x, safe="/:@&=+$,;?!~*'()#-._"),
                                  urllib.parse.quote(y, safe="/:@&=+$,;?!~*'()#-._"))):
                require(x1 not in replacements or replacements[x1] == y1,
                        "ASSET_REFERENCE_MAPPING_COLLISION")
                replacements[x1] = y1
    pattern = None
    if replacements:
        pattern = re.compile(r"(?<![A-Za-z0-9_.%-])(?:" + "|".join(
            re.escape(x) for x in sorted(replacements, key=lambda x: (-len(x), x)))
            + r")(?![A-Za-z0-9_.%/-])")
    result = {"proofSHA256": proof_sha, "mapping": mapping, "reverse": reverse,
              "replacements": replacements, "pattern": pattern,
              "buildPatterns": {"old": re.compile(r"(?<![A-Za-z0-9_-])" + re.escape(old_id) + r"(?![A-Za-z0-9_-])"),
                                "new": re.compile(r"(?<![A-Za-z0-9_-])" + re.escape(new_id) + r"(?![A-Za-z0-9_-])")}}
    if len(_CONTEXT_CACHE) >= 4:
        _CONTEXT_CACHE.pop(next(iter(_CONTEXT_CACHE)))
    _CONTEXT_CACHE[cache_key] = result
    return result


def _text(value, side, context):
    if side == "old" and context["pattern"] is not None:
        value = context["pattern"].sub(lambda m: context["replacements"][m[0]], value)
    return context["buildPatterns"][side].sub("<BUILD_ID>", value)


def _data(value, side, context, depth=0):
    require(depth <= 256, "GENERATED_JSON_DEPTH_BOUND")
    if isinstance(value, str):
        return _text(value, side, context)
    if isinstance(value, list):
        return [_data(x, side, context, depth + 1) for x in value]
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            new_key = _text(key, side, context)
            require(new_key not in result, "GENERATED_JSON_KEY_COLLISION")
            result[new_key] = _data(item, side, context, depth + 1)
        return result
    return value


def _reference(value, kind, side, context):
    key = "client:" + kind + ":" + _id(value)
    if side == "old":
        require(key in context["mapping"], "UNBOUND_FLIGHT_REFERENCE")
        target = context["mapping"][key].rsplit(":", 1)[1]
    else:
        require(key in context["reverse"], "UNBOUND_FLIGHT_REFERENCE")
        target = key.rsplit(":", 1)[1]
    return int(target) if type(value) is int else target


def _rsc(text, side, context):
    require(len(text.encode()) <= MAX_BYTES and "\r" not in text, "FLIGHT_STREAM_BOUND_OR_FORMAT")
    lines = text.split("\n")
    trailing = lines[-1] == ""
    if trailing:
        lines.pop()
    require(0 < len(lines) <= MAX_RECORDS, "FLIGHT_RECORD_BOUND")
    rows, imports = [], 0
    for line in lines:
        match = RECORD.fullmatch(line)
        require(match is not None, "FLIGHT_RECORD_HEADER_REQUIRED")
        record_id, payload = match.groups()
        tag = ""
        if payload.startswith("I"):
            tag, payload = "I", payload[1:]
        elif payload.startswith("HL"):
            tag, payload = "HL", payload[2:]
        elif payload.startswith("E"):
            tag, payload = "E", payload[1:]
        # Text/binary length-prefixed rows and unknown protocol tags are refused.
        # A string containing an I-like line is never treated as a real record.
        value = _json(payload)
        if tag == "I":
            require(record_id and isinstance(value, list) and len(value) in (3, 4)
                    and isinstance(value[1], list) and len(value[1]) % 2 == 0
                    and isinstance(value[2], str)
                    and (len(value) == 3 or type(value[3]) is int and value[3] == 1),
                    "FLIGHT_IMPORT_SCHEMA")
            value[0] = _reference(value[0], "module", side, context)
            for i in range(0, len(value[1]), 2):
                value[1][i] = _reference(value[1][i], "chunk", side, context)
                require(isinstance(value[1][i + 1], str), "FLIGHT_CHUNK_FILE_REQUIRED")
            imports += 1
        elif tag == "HL":
            require(record_id == "" and isinstance(value, list), "FLIGHT_LINK_HINT_SCHEMA")
        elif tag == "E":
            require(record_id and isinstance(value, dict), "FLIGHT_ERROR_SCHEMA")
        rows.append([record_id, tag, _data(value, side, context)])
    return {"records": rows, "trailingNewline": trailing}, {"records": len(rows), "imports": imports}


def _html(text, side, context):
    payloads, pieces, last = [], [], 0
    for match in SCRIPT.finditer(text):
        content = match[2]
        if content.startswith("self.__next_f.push("):
            push = PUSH.fullmatch(content)
            require(push is not None, "EXACT_FLIGHT_PUSH_EXPRESSION_REQUIRED")
            values = _json(push[1])
            require(isinstance(values, list) and len(values) == 2 and values[0] == 1
                    and isinstance(values[1], str), "HTML_FLIGHT_PAYLOAD_SCHEMA")
            pieces.extend([text[last:match.start(2)], "<FLIGHT_SEGMENT_" + str(len(payloads)) + ">"])
            last = match.end(2)
            payloads.append(values[1])
    require(payloads and len(payloads) <= 4096, "HTML_FLIGHT_SEGMENT_BOUND")
    pieces.append(text[last:])
    stream, counts = _rsc("".join(payloads), side, context)
    # Exact script positions/count/order and every non-Flight byte are retained;
    # only transport boundaries inside the same ordered Flight stream may move.
    skeleton = _text("".join(pieces), side, context)
    counts["htmlFlightSegments"] = len(payloads)
    return {"htmlSkeleton": skeleton, "flightStream": stream}, counts


def compare_generated(path, oldbytes, newbytes, jsproof, oldBuildId, newBuildId):
    """Return a reproducible typed witness, or None for any unclassified change."""
    _path(path)
    require(type(oldbytes) is bytes and type(newbytes) is bytes
            and len(oldbytes) <= MAX_BYTES and len(newbytes) <= MAX_BYTES,
            "GENERATED_FILE_BYTES_BOUND")
    if not path.endswith((".rsc", ".html")):
        return None
    context = _context(jsproof, oldBuildId, newBuildId)
    try:
        old, new = oldbytes.decode("utf-8"), newbytes.decode("utf-8")
        transform = _rsc if path.endswith(".rsc") else _html
        a, counts_a = transform(old, "old", context)
        b, counts_b = transform(new, "new", context)
        normalized_a, normalized_b = _canonical(a), _canonical(b)
        if normalized_a != normalized_b:
            return None
    except (Refusal, UnicodeDecodeError, json.JSONDecodeError, RecursionError, ValueError):
        return None
    return {"schema": "work8-v84-q05-typed-generated-witness-v1", "path": path,
            "status": "PASS_STATIC_TYPED_GENERATED_COMPARISON",
            "rule": "TYPED_FLIGHT_IMPORT_GRAPH" if path.endswith(".rsc") else "EXACT_HTML_AND_TYPED_FLIGHT_STREAM",
            "oldSHA256": sha(oldbytes), "newSHA256": sha(newbytes),
            "normalizedOldSHA256": sha(normalized_a), "normalizedNewSHA256": sha(normalized_b),
            "jsGraphProofCanonicalSHA256": context["proofSHA256"],
            "oldCounts": counts_a, "newCounts": counts_b,
            "applicationExecuted": False, "nativeQualification": False,
            "untypedNumbersChanged": False, "unclassifiedDifferenceWaived": False}


@functools.lru_cache(maxsize=1)
def _trusted_witness_index():
    """Load only the literal-pinned finite result set, never arbitrary claims."""
    path = pathlib.Path(__file__).resolve().with_name("frontend-generated-witness-index.json")
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        st = os.fstat(fd)
        require(stat.S_ISREG(st.st_mode) and st.st_nlink == 1 and 0 < st.st_size <= 4 * 1024 * 1024,
                "TRUSTED_WITNESS_INDEX_FILE_REQUIRED")
        with os.fdopen(fd, "rb", closefd=False) as stream:
            data = stream.read(4 * 1024 * 1024 + 1)
        require(len(data) == st.st_size and sha(data) == WITNESS_INDEX_SHA256,
                "TRUSTED_WITNESS_INDEX_DIGEST_REQUIRED")
    finally:
        os.close(fd)
    doc = _json(data)
    require(doc.get("schema") == "work8-v84-frontend-generated-witness-index-v1"
            and isinstance(doc.get("rows"), list) and len(doc["rows"]) == 3830,
            "TRUSTED_WITNESS_INDEX_SCHEMA_REQUIRED")
    result = {}
    for row in doc["rows"]:
        require(set(row) == {"path", "oldSHA256", "newSHA256", "jsGraphProofCanonicalSHA256", "witnessCanonicalSHA256"},
                "TRUSTED_WITNESS_ROW_SCHEMA_REQUIRED")
        _path(row["path"])
        require(all(HEX.fullmatch(row[k]) is not None for k in row if k != "path"),
                "TRUSTED_WITNESS_ROW_DIGEST_REQUIRED")
        key = tuple(row[k] for k in ("path", "oldSHA256", "newSHA256", "jsGraphProofCanonicalSHA256"))
        require(key not in result, "DUPLICATE_TRUSTED_WITNESS")
        result[key] = row["witnessCanonicalSHA256"]
    return result


def validate_witness(witness, path, oldSHA256, newSHA256, jsproof):
    """Admit an exact previously computed witness from the pinned finite set.

    Hashes alone do not repeat semantic comparison. This binds the actual
    comparison result independently reviewed with the source, and its complete
    JS proof, to the current archive's exact member hashes.
    """
    _path(path)
    require(all(isinstance(x, str) and HEX.fullmatch(x) is not None for x in (oldSHA256, newSHA256)),
            "EXACT_GENERATED_MEMBER_DIGESTS_REQUIRED")
    context = _context(jsproof, "_VALIDATOR_OLD_", "_VALIDATOR_NEW_")
    expected = {"schema", "path", "status", "rule", "oldSHA256", "newSHA256",
                "normalizedOldSHA256", "normalizedNewSHA256", "jsGraphProofCanonicalSHA256",
                "oldCounts", "newCounts", "applicationExecuted", "nativeQualification",
                "untypedNumbersChanged", "unclassifiedDifferenceWaived"}
    require(isinstance(witness, dict) and set(witness) == expected
            and witness.get("schema") == "work8-v84-q05-typed-generated-witness-v1"
            and witness.get("status") == "PASS_STATIC_TYPED_GENERATED_COMPARISON",
            "EXACT_TYPED_WITNESS_SCHEMA_REQUIRED")
    rule = "TYPED_FLIGHT_IMPORT_GRAPH" if path.endswith(".rsc") else "EXACT_HTML_AND_TYPED_FLIGHT_STREAM" if path.endswith(".html") else None
    require(rule and witness["rule"] == rule and witness["path"] == path
            and witness["oldSHA256"] == oldSHA256 and witness["newSHA256"] == newSHA256
            and witness["jsGraphProofCanonicalSHA256"] == context["proofSHA256"],
            "TYPED_WITNESS_OPERAND_BINDING_REQUIRED")
    require(all(witness[k] is False for k in ("applicationExecuted", "nativeQualification",
                                            "untypedNumbersChanged", "unclassifiedDifferenceWaived")),
            "TYPED_WITNESS_SCOPE_REQUIRED")
    require(all(HEX.fullmatch(str(witness[k])) is not None for k in ("normalizedOldSHA256", "normalizedNewSHA256"))
            and witness["normalizedOldSHA256"] == witness["normalizedNewSHA256"],
            "TYPED_NORMALIZED_EQUALITY_REQUIRED")
    counts = witness["oldCounts"]
    count_keys = {"records", "imports"} | ({"htmlFlightSegments"} if path.endswith(".html") else set())
    require(isinstance(counts, dict) and set(counts) == count_keys and counts == witness["newCounts"]
            and all(type(x) is int for x in counts.values())
            and 0 < counts["records"] <= MAX_RECORDS and 0 <= counts["imports"] <= counts["records"]
            and ("htmlFlightSegments" not in counts or 0 < counts["htmlFlightSegments"] <= 4096),
            "TYPED_WITNESS_COMPLETE_COUNTS_REQUIRED")
    encoded = json.dumps(witness, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()
    witness_sha = sha(encoded)
    key = (path, oldSHA256, newSHA256, context["proofSHA256"])
    require(_trusted_witness_index().get(key) == witness_sha,
            "EXACT_INDEPENDENTLY_REVIEWED_WITNESS_REQUIRED")
    return {"status": "PASS_PINNED_STATIC_WITNESS_BINDING", "witnessCanonicalSHA256": witness_sha,
            "trustedWitnessIndexSHA256": WITNESS_INDEX_SHA256,
            "reexecutedSemanticComparison": False, "nativeQualification": False}
