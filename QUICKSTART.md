# 🚀 WanderLog AI - Quick Start

Get WanderLog AI running in 5 minutes!

## 1. Setup (30 seconds)
```bash
./setup.sh
```

## 2. Deploy Backend (2 minutes)
```bash
./deploy_wanderlog.sh
```

## 3. Create Storage (1 minute)
```bash
gsutil mb gs://wanderlog-ai-data
gsutil mb gs://wanderlog-ai-stories
gsutil cors set cors.json gs://wanderlog-ai-stories
```

## 4. Test & Use (1 minute)
```bash
# Test the functionality
open test_frontend.html

# Use the full application
open wanderlog_ai.html
```

## 🎯 What You'll Get

- **Smart city suggestions** for any country
- **AI memory prompts** to jog your travel memories
- **Beautiful travel stories** generated from your answers
- **Multiple writing styles** (casual, poetic, punchy)
- **Story saving** and organization

## 🌍 Try It Now

1. Enter a country (e.g., "Thailand", "Japan", "Italy")
2. Select cities from AI suggestions
3. Answer personalized memory prompts
4. Generate your travel story
5. Save and share your memoir!

---

**📚 Full Documentation:** `WANDERLOG_README.md`
**🐛 Troubleshooting:** See the README for common issues 