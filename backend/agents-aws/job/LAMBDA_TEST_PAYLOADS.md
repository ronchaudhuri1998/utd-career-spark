# Job Market Tools Lambda Test Payloads

Test JSON payloads for the `UTD_JobMarketTools` Lambda function.

---

## Test 1: Scrape Hacker News Jobs

**Function**: `scrape_hackernews_jobs`  
**Description**: Scrapes current job postings from Hacker News "Who is Hiring?" thread

```json
{
  "actionGroup": "job_market_tools",
  "function": "scrape_hackernews_jobs",
  "parameters": []
}
```

---

## Test 2: Scrape IT Jobs Watch Skills

**Function**: `scrape_itjobswatch_skills`  
**Description**: Fetches trending tech skills and salary data from IT Jobs Watch

```json
{
  "actionGroup": "job_market_tools",
  "function": "scrape_itjobswatch_skills",
  "parameters": []
}
```

---

## Expected Response Format

### Success Response:

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "job_market_tools",
    "function": "scrape_hackernews_jobs",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{\"roles\": [...], \"summary\": \"Found X job postings\", \"count\": X}"
        }
      }
    }
  }
}
```

---

## Notes

- These functions make external HTTP requests to scrape web pages
- May take 10-60 seconds to complete
- Results depend on current content on external websites
- No API key required for these functions
