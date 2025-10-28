# Validation Lambda Test Payloads

Test JSON payloads for validation Lambda functions.

---

## Test 1: Validate Course Format

**Lambda**: `UTD_ValidateCourse`

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_course_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== COURSE CATALOG ===\nCourse #1:\nCode: CS1336\nName: Programming Fundamentals\nCredits: 3\nDifficulty: beginner\nPrerequisites: None\nDescription: Introduction to programming\n\n=== SEMESTER PLAN ===\n- Fall 2024 (3 credits): CS1336\n\n=== PREREQUISITES ===\n- None\n\n=== SKILL AREAS ===\n- Programming (high importance): CS1336\n\n=== ACADEMIC RESOURCES ===\n[tutoring] CS Learning Center\nDrop-in tutoring for programming"
    }
  ]
}
```

---

## Test 2: Validate Job Market Format

**Lambda**: `UTD_ValidateJobMarket`

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_job_market_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== JOB LISTINGS ===\nJob #1:\nTitle: Software Engineer\nCompany: Tech Corp\nLocation: Remote\nType: Full-time\nSkills: Python, JavaScript\n\n=== HOT ROLES ===\n- Software Engineer (50 openings) [trending up]\n\n=== IN-DEMAND SKILLS ===\n- Python (high demand, 120 listings)\n\n=== TOP EMPLOYERS ===\n- Tech Corp (15 openings)\n\n=== MARKET TRENDS ===\n[POSITIVE] Remote Work\nRemote work is becoming increasingly common"
    }
  ]
}
```

---

## Test 3: Validate Project Format

**Lambda**: `UTD_ValidateProject`

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_project_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== PROJECT RECOMMENDATIONS ===\nProject #1:\nTitle: Build a Weather App\nDescription: Create a weather app using API integration\nSkills: JavaScript, API integration\nDifficulty: beginner\nEstimated Time: 2-3 weeks\nCategory: Web Development\nCareer Relevance: Full-stack development skills"
    }
  ]
}
```

---

## Expected Response Format

### Valid Response:

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "validation_tools",
    "function": "validate_course_format",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{\"is_valid\": true, \"errors\": [], \"warnings\": [...], \"message\": \"✓ Format is valid\"}"
        }
      }
    }
  }
}
```

### Invalid Response (missing required fields):

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "validation_tools",
    "function": "validate_course_format",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{\"is_valid\": false, \"errors\": [\"Missing required section: === SEMESTER PLAN ===\"], \"warnings\": [...], \"message\": \"✗ Format is invalid: 1 errors, X warnings\"}"
        }
      }
    }
  }
}
```

---

## Test with Missing Parameter

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_course_format",
  "parameters": []
}
```

**Expected**: Returns error message that no `response_text` parameter was provided.

---

## Note

- Validation functions check for required sections and proper formatting
- Warnings indicate formatting issues that don't break validation
- Errors indicate missing required elements
