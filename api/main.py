"""
TokenFair API v2 — FastAPI Backend
- 5 Languages: English, Tamil, Hindi, French, Arabic
- 10 LLM Tokenizer Comparison
- Prompt Token Estimator
- Auto Translation
- Dataset Stats
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tiktoken
import regex as re
import os
import pandas as pd
import urllib.request
import urllib.parse
import json as _json

app = FastAPI(title="TokenFair API v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load all tokenizers once at startup ─────────────────────
TOKENIZERS = {
    "GPT-4 / GPT-3.5":      tiktoken.get_encoding("cl100k_base"),
    "GPT-4o":                tiktoken.get_encoding("o200k_base"),
    "GPT-4o-mini":           tiktoken.get_encoding("o200k_base"),
    "GPT-3.5-Turbo-Instruct":tiktoken.get_encoding("cl100k_base"),
    "GPT-4-Turbo":           tiktoken.get_encoding("cl100k_base"),
    "GPT-2":                 tiktoken.get_encoding("gpt2"),
    "text-davinci-003":      tiktoken.get_encoding("p50k_base"),
    "text-davinci-002":      tiktoken.get_encoding("p50k_base"),
    "code-davinci-002":      tiktoken.get_encoding("p50k_base"),
    "davinci-002":           tiktoken.get_encoding("r50k_base"),
}

TOKENIZER_META = {
    "GPT-4 / GPT-3.5":       {"vocab": 100277, "encoding": "cl100k_base", "family": "GPT-4"},
    "GPT-4o":                 {"vocab": 200019, "encoding": "o200k_base",  "family": "GPT-4o"},
    "GPT-4o-mini":            {"vocab": 200019, "encoding": "o200k_base",  "family": "GPT-4o"},
    "GPT-4-Turbo":            {"vocab": 100277, "encoding": "cl100k_base", "family": "GPT-4"},
    "GPT-3.5-Turbo-Instruct": {"vocab": 100277, "encoding": "cl100k_base", "family": "GPT-3.5"},
    "text-davinci-003":       {"vocab": 50281,  "encoding": "p50k_base",   "family": "GPT-3"},
    "text-davinci-002":       {"vocab": 50281,  "encoding": "p50k_base",   "family": "GPT-3"},
    "code-davinci-002":       {"vocab": 50281,  "encoding": "p50k_base",   "family": "Codex"},
    "davinci-002":            {"vocab": 50257,  "encoding": "r50k_base",   "family": "Legacy"},
    "GPT-2":                  {"vocab": 50257,  "encoding": "gpt2",        "family": "GPT-2"},
}

LANGUAGES = ["english", "tamil", "hindi", "french", "arabic"]

LANG_CODES = {
    "tamil":   "ta",
    "hindi":   "hi",
    "french":  "fr",
    "arabic":  "ar",
}

INPUT_PRICE_PER_1K  = 0.0005
OUTPUT_PRICE_PER_1K = 0.0015
COMBINED_PRICE      = INPUT_PRICE_PER_1K + OUTPUT_PRICE_PER_1K

# ── Custom syllable tokenizer ────────────────────────────────
TAMIL_SYLLABLE  = re.compile(
    r"[\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F"
    r"\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9]"
    r"[\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7]?"
    r"|[\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95]"
)
HINDI_SYLLABLE  = re.compile(
    r"[\u0915-\u0939\u0958-\u095F\u0960\u0961][\u093E-\u094C\u094D]?"
    r"|[\u0905-\u0914\u0960\u0961]"
)
ARABIC_WORD     = re.compile(r"[\u0600-\u06FF\u0750-\u077F]+")
LATIN_TOKEN     = re.compile(r"\w+(?:'\w+)*|[^\w\s]")

def custom_tokenize(text: str, lang: str) -> list:
    if not text or not text.strip():
        return []
    if lang == "tamil":
        t = TAMIL_SYLLABLE.findall(text)
        return t if t else text.split()
    elif lang == "hindi":
        t = HINDI_SYLLABLE.findall(text)
        return t if t else text.split()
    elif lang == "arabic":
        t = ARABIC_WORD.findall(text)
        return t if t else text.split()
    else:
        return LATIN_TOKEN.findall(text)

def gpt_count(text: str, enc=None) -> int:
    if not text or not text.strip():
        return 0
    if enc is None:
        enc = TOKENIZERS["GPT-4 / GPT-3.5"]
    return len(enc.encode(text))

def tis_score(lang_tok: int, eng_tok: int):
    if eng_tok == 0:
        return None
    return round((lang_tok / eng_tok) - 1, 4)

def cost_usd(tokens: int, users: int) -> float:
    return round((tokens * users / 1000) * COMBINED_PRICE, 6)

# ── Pydantic models ──────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    texts: dict
    users: int = 1000

class TranslateRequest(BaseModel):
    text: str

class PromptEstimateRequest(BaseModel):
    prompt: str
    users: int = 1000

class LLMCompareRequest(BaseModel):
    texts: dict   # {lang: text}

class TokenizeRequest(BaseModel):
    text: str
    llm: str = "GPT-4 / GPT-3.5"

def _token_pieces(text: str, enc) -> list:
    if not text or not text.strip():
        return []
    ids = enc.encode(text[:4000])
    return [{"id": tid, "text": enc.decode([tid]), "index": i} for i, tid in enumerate(ids)]

def _translate_all(english: str) -> dict:
    results = {"english": english}
    for lang, code in LANG_CODES.items():
        try:
            query = urllib.parse.urlencode({"q": english, "langpair": f"en|{code}"})
            url   = f"https://api.mymemory.translated.net/get?{query}"
            with urllib.request.urlopen(url, timeout=8) as resp:
                data = _json.loads(resp.read().decode())
            if data.get("responseStatus") == 200:
                results[lang] = data["responseData"]["translatedText"]
            else:
                results[lang] = ""
        except Exception:
            results[lang] = ""
    return results

# ── Endpoints ────────────────────────────────────────────────

@app.get("/")
def root():
    return {"name": "TokenFair API", "version": "2.0.0",
            "endpoints": ["/analyze", "/translate", "/prompt-estimate",
                          "/llm-compare", "/tokenize-visual", "/tokenize-race",
                          "/dataset-stats", "/health"]}

@app.get("/health")
def health():
    return {"status": "ok", "tokenizers": len(TOKENIZERS), "languages": len(LANGUAGES)}

@app.post("/translate")
def translate_text(req: TranslateRequest):
    return _translate_all(req.text)

@app.post("/tokenize-visual")
def tokenize_visual(req: TokenizeRequest):
    """Return individual GPT tokens for live visualization."""
    llm = req.llm if req.llm in TOKENIZERS else "GPT-4 / GPT-3.5"
    enc = TOKENIZERS[llm]
    text = req.text[:4000]
    pieces = _token_pieces(text, enc)
    count = len(pieces)
    return {
        "text": text,
        "llm": llm,
        "tokens": pieces,
        "count": count,
        "char_count": len(text),
        "chars_per_token": round(len(text) / count, 2) if count else 0,
        "meta": TOKENIZER_META.get(llm, {}),
    }

@app.post("/tokenize-race")
def tokenize_race(req: TranslateRequest):
    """
    Translate English to all languages, tokenize each, return a 'race'
    comparing how many tokens each language needs for the same meaning.
    """
    translations = _translate_all(req.text[:800])
    enc = TOKENIZERS["GPT-4 / GPT-3.5"]
    eng_count = gpt_count(translations.get("english", ""), enc) or 1
    languages = {}
    for lang in LANGUAGES:
        text = translations.get(lang, "")
        pieces = _token_pieces(text, enc)
        count = len(pieces)
        languages[lang] = {
            "text": text,
            "count": count,
            "tokens": pieces[:120],
            "tis": 0.0 if lang == "english" else (tis_score(count, eng_count) or 0),
            "chars_per_token": round(len(text) / count, 2) if count else 0,
        }
    winner = min(LANGUAGES, key=lambda l: languages[l]["count"] or 9999)
    return {
        "languages": languages,
        "english_tokens": eng_count,
        "winner": winner,
        "max_overhead_lang": max(
            [l for l in LANGUAGES if l != "english"],
            key=lambda l: languages[l]["count"],
        ),
    }

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    enc = TOKENIZERS["GPT-4 / GPT-3.5"]
    results = {}
    gpt_counts = {}
    for lang in LANGUAGES:
        text = req.texts.get(lang, "")
        g = gpt_count(text, enc)
        c = len(custom_tokenize(text, lang))
        w = len(text.split()) if text else 0
        gpt_counts[lang] = g
        results[lang] = {
            "text": text, "gpt_tokens": g, "custom_tokens": c,
            "word_count": w,
            "semantic_density": round(w / g, 4) if g > 0 else None,
            "api_cost_usd": cost_usd(g, req.users),
        }
    eng_g = gpt_counts.get("english", 1)
    for lang in ["tamil", "hindi", "french", "arabic"]:
        results[lang]["tis_gpt"] = tis_score(gpt_counts[lang], eng_g)
    results["english"]["tis_gpt"] = 0.0
    most_biased = max(
        ["tamil", "hindi", "french", "arabic"],
        key=lambda l: results[l].get("tis_gpt") or 0
    )
    eng_cost = results["english"]["api_cost_usd"]
    return {
        "languages": results,
        "most_biased": most_biased,
        "cost_overhead": {
            lang: round(((results[lang]["api_cost_usd"] - eng_cost) / eng_cost * 100), 2)
            if eng_cost > 0 else 0
            for lang in ["tamil", "hindi", "french", "arabic"]
        },
        "users_simulated": req.users,
    }

@app.post("/prompt-estimate")
def prompt_estimate(req: PromptEstimateRequest):
    """
    Prompt Engineer Tool:
    Given one English prompt, estimate tokens + cost for all 5 languages
    by translating and computing token counts across all 10 LLM tokenizers.
    """
    # 1. Translate to all languages
    translations = {"english": req.prompt}
    for lang, code in LANG_CODES.items():
        try:
            query = urllib.parse.urlencode({"q": req.prompt, "langpair": f"en|{code}"})
            url   = f"https://api.mymemory.translated.net/get?{query}"
            with urllib.request.urlopen(url, timeout=8) as resp:
                data = _json.loads(resp.read().decode())
            translations[lang] = data["responseData"]["translatedText"] \
                if data.get("responseStatus") == 200 else req.prompt
        except:
            translations[lang] = req.prompt

    # 2. Token count per language per LLM tokenizer
    enc_default = TOKENIZERS["GPT-4 / GPT-3.5"]
    results = {}
    for lang in LANGUAGES:
        text = translations.get(lang, "")
        lang_data = {
            "text": text,
            "word_count": len(text.split()),
            "by_llm": {},
        }
        for llm_name, enc in TOKENIZERS.items():
            tokens = gpt_count(text, enc)
            lang_data["by_llm"][llm_name] = tokens
        # Best tokenizer for this lang (fewest tokens)
        best_llm = min(lang_data["by_llm"], key=lambda k: lang_data["by_llm"][k])
        lang_data["best_llm"]    = best_llm
        lang_data["best_tokens"] = lang_data["by_llm"][best_llm]
        lang_data["gpt4_tokens"] = lang_data["by_llm"].get("GPT-4 / GPT-3.5", 0)
        lang_data["cost_usd"]    = cost_usd(lang_data["gpt4_tokens"], req.users)
        lang_data["tis"]         = tis_score(
            lang_data["gpt4_tokens"],
            gpt_count(translations.get("english", ""), enc_default)
        ) if lang != "english" else 0.0
        results[lang] = lang_data

    eng_tokens = results["english"]["gpt4_tokens"]
    return {
        "prompt":      req.prompt,
        "languages":   results,
        "eng_tokens":  eng_tokens,
        "tip":         _prompt_tip(results),
        "users":       req.users,
    }

def _prompt_tip(results):
    most_expensive = max(
        [l for l in LANGUAGES if l != "english"],
        key=lambda l: results[l].get("gpt4_tokens", 0)
    )
    eng = results["english"]["gpt4_tokens"]
    exp = results[most_expensive]["gpt4_tokens"]
    ratio = round(exp / eng, 1) if eng > 0 else 1
    tips = []
    if ratio > 5:
        tips.append(f"{most_expensive.capitalize()} uses {ratio}x more tokens than English. "
                    f"Consider shorter prompts or chunking for {most_expensive} deployments.")
    if eng > 100:
        tips.append("Your prompt is long (>100 tokens). Shorter system prompts reduce cost significantly.")
    if not tips:
        tips.append("Token usage looks reasonable across languages.")
    return tips

@app.post("/llm-compare")
def llm_compare(req: LLMCompareRequest):
    """
    Compare how 10 LLM tokenizers handle the same text across 5 languages.
    Returns a matrix: LLM x Language -> token count.
    """
    matrix = {}
    for llm_name, enc in TOKENIZERS.items():
        matrix[llm_name] = {}
        for lang in LANGUAGES:
            text = req.texts.get(lang, "")
            matrix[llm_name][lang] = gpt_count(text, enc)

    # Find best LLM per language (fewest tokens)
    best_per_lang = {}
    for lang in LANGUAGES:
        best_llm = min(TOKENIZERS.keys(),
                       key=lambda k: matrix[k][lang] if matrix[k][lang] > 0 else 9999)
        best_per_lang[lang] = {
            "llm": best_llm,
            "tokens": matrix[best_llm][lang],
        }

    # TIS per LLM (tamil vs english for each tokenizer)
    tis_per_llm = {}
    for llm_name in TOKENIZERS:
        eng_t = matrix[llm_name].get("english", 1)
        tis_per_llm[llm_name] = {}
        for lang in LANGUAGES:
            tis_per_llm[llm_name][lang] = tis_score(matrix[llm_name][lang], eng_t)

    return {
        "matrix":        matrix,
        "best_per_lang": best_per_lang,
        "tis_per_llm":   tis_per_llm,
        "llm_meta":      TOKENIZER_META,
        "texts":         req.texts,
    }

@app.get("/dataset-stats")
def dataset_stats():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "tokenfair_results_final.csv")
    try:
        df = pd.read_csv(csv_path)
        stats = {}
        for lang in ["english", "tamil", "hindi", "french"]:
            col = f"gpt_{lang}"
            if col in df.columns:
                stats[lang] = {
                    "mean_gpt_tokens":   round(df[col].mean(), 2),
                    "median_gpt_tokens": round(df[col].median(), 2),
                    "total_gpt_tokens":  int(df[col].sum()),
                }
        tis_stats = {}
        for lang in ["tamil", "hindi", "french"]:
            col = f"tis_gpt_{lang}"
            if col in df.columns:
                tis_stats[lang] = {
                    "mean":   round(df[col].dropna().mean(), 4),
                    "median": round(df[col].dropna().median(), 4),
                    "std":    round(df[col].dropna().std(), 4),
                }
        domain_tis = {}
        if "domain" in df.columns:
            for domain in df["domain"].unique():
                sub = df[df["domain"] == domain]
                domain_tis[domain] = {
                    lang: round(sub[f"tis_gpt_{lang}"].dropna().mean(), 4)
                    for lang in ["tamil", "hindi", "french"]
                    if f"tis_gpt_{lang}" in sub.columns
                }
        return {
            "total_rows": len(df),
            "domains":    df["domain"].unique().tolist() if "domain" in df.columns else [],
            "token_stats": stats,
            "tis_stats":   tis_stats,
            "domain_tis":  domain_tis,
        }
    except Exception as e:
        return {"error": str(e)}
