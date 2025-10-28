# Lambda Validation Test Samples

Use these sample inputs to test the validation Lambda functions in the AWS Lambda console.

## Test Event for Job Market Validation

**Function:** `UTD_ValidateJobMarket`

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_job_market_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== JOB LISTINGS ===\n\nJob #1:\nTitle: Software Engineer\nCompany: Tech Corp\nLocation: Dallas, TX\nSalary: $80k-120k\nType: Full-time\nSkills: React, Node.js, TypeScript\nPosted: 2 days ago\nDescription: Looking for a talented engineer...\n\nJob #2:\nTitle: Data Scientist\nCompany: AI Labs\nLocation: Austin, TX\nType: Full-time\nSkills: Python, Machine Learning, SQL\nDescription: Join our AI team...\n\n=== HOT ROLES ===\n- Software Engineer (150 openings) [trending up]\n- Frontend Developer (85 openings) [stable]\n- Data Scientist (120 openings) [trending up]\n\n=== IN-DEMAND SKILLS ===\n- React (high demand, 200 listings)\n- Python (medium demand, 120 listings)\n- JavaScript (high demand, 180 listings)\n\n=== TOP EMPLOYERS ===\n- Tech Corp (25 openings, Dallas TX)\n- Innovation Labs (18 openings)\n- AI Solutions (22 openings, Austin TX)\n\n=== MARKET TRENDS ===\n[POSITIVE] AI/ML Integration\nIncreasing demand for AI and machine learning skills across all industries...\n\n[NEUTRAL] Remote Work Normalization\nMore companies offering remote options, but hybrid models are becoming standard...\n\n[NEGATIVE] Economic Uncertainty\nSome companies reducing hiring, focusing on essential roles only..."
    }
  ]
}
```

## Test Event for Course Validation

**Function:** `UTD_ValidateCourse`

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_course_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== COURSE CATALOG ===\n\nCourse #1:\nCode: CS 4375\nName: Introduction to Machine Learning\nCredits: 3\nDifficulty: intermediate\nPrerequisites: CS 3341, MATH 2418\nSemester: Fall 2024\nProfessor: Dr. Smith\nSkills: Python, scikit-learn, TensorFlow\nDescription: Comprehensive introduction to ML algorithms...\n\nCourse #2:\nCode: CS 4347\nName: Database Systems\nCredits: 3\nDifficulty: intermediate\nPrerequisites: CS 3341\nSkills: SQL, Database Design, PostgreSQL\nDescription: Design and implementation of database systems...\n\n=== SEMESTER PLAN ===\n- Fall 2024 (12 credits): CS 4375, CS 4347, MATH 2418\n- Spring 2025 (15 credits): CS 4384, CS 4351, CS 4348\n- Fall 2025 (12 credits): CS 4390, CS 4349, CS 4352\n\n=== PREREQUISITES ===\n- CS 3341 (required for: CS 4375, CS 4347, CS 4384)\n- MATH 2418 (required for: CS 4375, CS 4351)\n- CS 4347 (required for: CS 4348, CS 4349)\n\n=== SKILL AREAS ===\n- Machine Learning (high importance): CS 4375, CS 4384\n- Database Systems (medium importance): CS 4347, CS 4348\n- Software Engineering (high importance): CS 4351, CS 4352\n\n=== ACADEMIC RESOURCES ===\n[tutoring] CS Tutoring Center\nFree tutoring for all CS courses, located in ECSS 2.4...\n\n[workshop] ML Workshop Series\nMonthly workshops on machine learning topics...\n\n[lab] Database Lab\nHands-on database design and implementation...\n\n[club] CS Student Organization\nNetworking and professional development events...\n\n[certification] AWS Cloud Practitioner\nRecommended certification for cloud computing courses..."
    }
  ]
}
```

## Test Event for Project Validation

**Function:** `UTD_ValidateProject`

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_project_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== PROJECT RECOMMENDATIONS ===\n\nProject #1:\nTitle: Personal Portfolio Website\nDescription: Build a responsive portfolio website showcasing your projects and skills. Include sections for about, projects, skills, and contact information.\nSkills: HTML, CSS, JavaScript, React, Git\nDifficulty: beginner\nEstimated Time: 2-3 weeks\nCategory: Web Development\nCareer Relevance: Essential for any developer role, demonstrates frontend skills\n\nProject #2:\nTitle: Machine Learning Model for Stock Prediction\nDescription: Develop a machine learning model to predict stock prices using historical data. Use Python libraries like pandas, scikit-learn, and implement various algorithms.\nSkills: Python, Machine Learning, Pandas, Scikit-learn, Data Analysis\nDifficulty: intermediate\nEstimated Time: 4-6 weeks\nCategory: Data Science\nCareer Relevance: High demand for ML skills in finance and tech industries\n\nProject #3:\nTitle: RESTful API with Authentication\nDescription: Create a RESTful API with user authentication, CRUD operations, and database integration. Include proper error handling and API documentation.\nSkills: Node.js, Express, MongoDB, JWT, API Design\nDifficulty: intermediate\nEstimated Time: 3-4 weeks\nCategory: Backend Development\nCareer Relevance: Critical for backend developer positions\n\nProject #4:\nTitle: Real-time Chat Application\nDescription: Build a real-time chat application using WebSockets. Include features like private messaging, group chats, and message history.\nSkills: WebSockets, Socket.io, React, Node.js, Real-time Programming\nDifficulty: advanced\nEstimated Time: 5-6 weeks\nCategory: Full-stack Development\nCareer Relevance: Demonstrates full-stack capabilities and real-time programming skills"
    }
  ]
}
```

## Invalid Test Event (Missing Sections)

**Function:** Any of the above functions

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_job_market_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "Here's some job market information:\n\nSoftware Engineer at Tech Corp\nData Scientist at AI Labs\n\nSome trending skills:\n- Python\n- React\n- JavaScript\n\nThat's all the information I have."
    }
  ]
}
```

## Malformed Test Event (Wrong Structure)

**Function:** Any of the above functions

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_job_market_format",
  "parameters": [
    {
      "name": "response_text",
      "type": "string",
      "value": "=== JOB LISTINGS ===\n\nJob #1:\nTitle: Software Engineer\nCompany: Tech Corp\n# Missing required fields: Location, Type, Skills\n\n=== HOT ROLES ===\n- Software Engineer (150 openings) [invalid trend]\n# Wrong trend format\n\n=== IN-DEMAND SKILLS ===\n- React (invalid demand level, 200 listings)\n# Wrong demand level format\n\n=== TOP EMPLOYERS ===\n- Tech Corp (25 openings, Dallas TX)\n# This section is OK\n\n=== MARKET TRENDS ===\n[INVALID] Some trend\n# Wrong trend type"
    }
  ]
}
```

## No Parameters Test Event

**Function:** Any of the above functions

```json
{
  "actionGroup": "validation_tools",
  "function": "validate_job_market_format",
  "parameters": []
}
```

## Expected Response Format

All validation functions should return a response in this format:

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "validation_tools",
    "function": "validate_job_market_format",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{\"is_valid\": true, \"errors\": [], \"warnings\": [], \"message\": \"✓ Format is valid\"}"
        }
      }
    }
  }
}
```

## How to Test in AWS Lambda Console

1. Go to AWS Lambda console
2. Select one of the validation functions (`UTD_ValidateJobMarket`, `UTD_ValidateCourse`, or `UTD_ValidateProject`)
3. Click "Test" button
4. Create a new test event
5. Copy one of the JSON test events above
6. Click "Test" to run the function
7. Check the response for validation results

## Expected Results

- **Valid format**: `is_valid: true`, no errors, possibly some warnings
- **Invalid format**: `is_valid: false`, list of errors describing what's missing
- **Malformed format**: `is_valid: true`, but with warnings about formatting issues
- **No parameters**: `is_valid: false`, error about missing response_text parameter
