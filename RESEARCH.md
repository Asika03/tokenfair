# TokenFair: Quantifying Tokenization Bias in Multilingual LLM Applications

## Abstract

Large Language Models rely on byte-pair encoding (BPE) tokenizers trained predominantly on English corpora. This creates a systematic disadvantage for users of non-Latin-script languages — they consume significantly more tokens per sentence, leading to higher API costs, reduced context window capacity, and degraded semantic density. This paper introduces the **Tokenization Inequality Score (TIS)**, a novel metric to measure this bias, demonstrated on 1,879 parallel sentences across 20 domains in English, Tamil, Hindi, and French.

---

## 1. Problem Statement

GPT-4 and GPT-3.5-Turbo use the `cl100k_base` BPE tokenizer. Because it was trained on English-dominated data, it assigns short efficient tokens to English words while fragmenting Tamil and Hindi characters into many sub-word tokens. The consequences:

- Higher API costs for non-English users asking the same question
- Context window shrinkage — fewer sentences fit in the same token budget
- Semantic inefficiency — more tokens carry less meaning per unit

This is a design outcome that can be measured and partially corrected.

---

## 2. Dataset

| Property | Value |
|---|---|
| Total sentences | 1,879 |
| Languages | English, Tamil, Hindi, French |
| Domains | 20 (Agriculture, Banking, Education, Healthcare, Legal, Technology, ...) |
| Format | CSV: domain, english, tamil, hindi, french |

---

## 3. Methodology

### 3.1 Tokenizers Compared

**GPT Tokenizer (cl100k_base)**
Used by GPT-3.5-Turbo and GPT-4. Loaded locally via `tiktoken`. BPE-based, English-dominant training.

**Custom Fair Tokenizer**
- Tamil: Unicode akshara syllable segmentation (U+0B85-U+0BB9 + vowel marks)
- Hindi: Devanagari matra-aware syllable segmentation (U+0915-U+0939 + matras)
- English/French: word + punctuation regex split

### 3.2 Tokenization Inequality Score (TIS)

    TIS_lang = (tokens_lang / tokens_English) - 1

- TIS = 0: perfectly fair (same token count as English)
- TIS > 0: more tokens than English (bias against that language)
- TIS >= 40%: HIGH BIAS | 10-40%: MODERATE | <10%: LOW

### 3.3 Semantic Density

    Semantic Density = words / gpt_tokens

Higher = more meaning packed per token.

### 3.4 API Cost Model (GPT-3.5-Turbo)

    Cost = (total_tokens * users / 1000) * 0.002

Input: $0.0005/1K + Output: $0.0015/1K = $0.002/1K combined

---

## 4. Results

### 4.1 Token Count Overhead

| Language | Avg GPT Tokens | vs English | TIS% |
|---|---|---|---|
| English | ~10 | baseline | 0% |
| French  | ~12 | ~1.2x | ~20% |
| Hindi   | ~35 | ~3.5x | ~250% |
| Tamil   | ~70 | ~7.0x | ~600% |

### 4.2 Context Window Impact (GPT-4 128K)
- Tamil: ~85-90% capacity loss vs English
- Hindi: ~65-75% capacity loss vs English

### 4.3 Key Findings

1. Tamil/Hindi users are systematically overcharged — same question costs 5-7x more tokens
2. Context window shrinkage is a real capacity penalty — Tamil loses 80%+ of available context
3. Bias varies by domain — technical/medical domains show higher TIS
4. Custom syllable tokenizers reduce the gap significantly
5. Tokenization bias is a design choice, not inevitable

---

## 5. Novel Contributions

| Contribution | Description |
|---|---|
| TIS Metric | Quantitative per-sentence fairness score vs English baseline |
| Cost Inequality Analysis | Real-dollar impact of tokenization bias at scale |
| Context Window Shrinkage | Sentences-that-fit simulation across 4 LLM context sizes |
| Semantic Density | words/tokens ratio measuring information efficiency |
| Custom Fair Tokenizer | Unicode akshara/matra tokenizer for Tamil and Hindi |
| Interactive Dashboard | React + FastAPI tool for live tokenization analysis |
| Developer API | POST /analyze endpoint returning TIS + cost for any multilingual text |

---

## 6. Stack

| Component | Technology |
|---|---|
| Tokenization | tiktoken (cl100k_base), custom regex |
| Analysis | Python, pandas, numpy |
| Visualization | matplotlib, seaborn (notebook), Recharts (dashboard) |
| API | FastAPI + uvicorn |
| Dashboard | React 18 + Vite |
| Cost | $0 — fully local, no paid APIs |

---

## 7. How to Run

### Notebook
    cd /Users/asikaa/Documents/TokenFair
    jupyter notebook Language_Fairness_Tokenization.ipynb

### API (starts on port 8000)
    cd /Users/asikaa/Documents/TokenFair/api
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

### Dashboard (starts on port 5173)
    cd /Users/asikaa/Documents/TokenFair/dashboard
    npm install
    npm run dev

Open http://localhost:5173 — the dashboard auto-connects to the API.

---

## 8. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | API status check |
| GET | /dataset-stats | Full precomputed stats from CSV |
| POST | /analyze | TIS + cost for custom multilingual text |
| GET | /compare?text=...&users=1000 | Quick single-text token analysis |

---

## 9. Future Work

- Extend to Arabic, Chinese, Japanese, Korean
- Train a balanced multilingual BPE tokenizer
- Measure TIS on GPT-4o and Claude 3.5 tokenizers
- Propose fairness-aware tokenizer regularization objective
- Publish as open benchmark for multilingual LLM evaluation

---

*All analysis performed locally. No paid APIs used. Dataset: 1,879 parallel sentences, 20 domains.*
