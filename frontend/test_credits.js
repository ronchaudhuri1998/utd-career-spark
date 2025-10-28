#!/usr/bin/env node
/**
 * Test frontend parser and API helpers for credit computation
 */

// Mock the API functions for testing
const mockCourseDetails = {
  "CS 1337": {
    title: "Computer Science I",
    credit_hours: "3 Semester Credit Hours",
    prerequisites: "None",
  },
  "CS 2336": {
    title: "Computer Science II",
    credit_hours: "3 Semester Credit Hours",
    prerequisites: "CS 1337",
  },
  "CS 3345": {
    title: "Data Structures",
    credit_hours: "3 Semester Credit Hours",
    prerequisites: "CS 2336",
  },
  "MATH 2413": {
    title: "Calculus I",
    credit_hours: "4 Semester Credit Hours",
    prerequisites: "None",
  },
};

// Mock fetchCourseDetails
function fetchCourseDetails(courseCode) {
  const details = mockCourseDetails[courseCode] || {};
  return Promise.resolve(details);
}

// Mock parseNumericCredits
function parseNumericCredits(creditHours) {
  if (typeof creditHours === "number")
    return Number.isFinite(creditHours) ? creditHours : null;
  if (!creditHours || typeof creditHours !== "string") return null;
  const m = creditHours.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// Mock enrichSemestersWithCredits
async function enrichSemestersWithCredits(semesters, concurrency = 6) {
  const unique = new Set();
  semesters.forEach((s) => s.courses.forEach((c) => unique.add(c)));
  const codes = Array.from(unique);

  const results = new Map();

  // Simple concurrency control
  let idx = 0;
  async function worker() {
    while (idx < codes.length) {
      const code = codes[idx++];
      try {
        const details = await fetchCourseDetails(code);
        const n = parseNumericCredits(details?.credit_hours);
        if (n !== null) results.set(code, n);
      } catch {
        // ignore fetch errors; leave missing
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, codes.length) }, worker)
  );

  return semesters.map((s) => {
    const total = s.courses.reduce((sum, c) => sum + (results.get(c) ?? 0), 0);
    return { ...s, totalCredits: total > 0 ? total : 0 };
  });
}

// Test data
const testSemesters = [
  { name: "Fall 2025", courses: ["CS 1337", "MATH 2413"], totalCredits: 0 },
  { name: "Spring 2026", courses: ["CS 2336"], totalCredits: 0 },
  { name: "Fall 2026", courses: ["CS 3345"], totalCredits: 0 },
];

async function testCreditComputation() {
  console.log("=== Testing Credit Computation ===");

  console.log("Before enrichment:");
  testSemesters.forEach((s) => {
    console.log(
      `  ${s.name}: ${s.courses.join(", ")} (${s.totalCredits} credits)`
    );
  });

  const enriched = await enrichSemestersWithCredits(testSemesters);

  console.log("\nAfter enrichment:");
  enriched.forEach((s) => {
    console.log(
      `  ${s.name}: ${s.courses.join(", ")} (${s.totalCredits} credits)`
    );
  });

  // Verify totals
  const expectedTotals = [7, 3, 3]; // CS 1337(3) + MATH 2413(4), CS 2336(3), CS 3345(3)
  const actualTotals = enriched.map((s) => s.totalCredits);

  console.log("\nVerification:");
  console.log(`Expected totals: [${expectedTotals.join(", ")}]`);
  console.log(`Actual totals: [${actualTotals.join(", ")}]`);
  console.log(
    `Match: ${JSON.stringify(expectedTotals) === JSON.stringify(actualTotals)}`
  );
}

// Test parseNumericCredits
function testParseCredits() {
  console.log("\n=== Testing Credit Parsing ===");

  const testCases = [
    "3 Semester Credit Hours",
    "4 Semester Credit Hours",
    "3.5 Semester Credit Hours",
    "3",
    3,
    null,
    undefined,
    "Invalid",
  ];

  testCases.forEach((testCase) => {
    const result = parseNumericCredits(testCase);
    console.log(`  "${testCase}" -> ${result}`);
  });
}

// Run tests
async function runTests() {
  testParseCredits();
  await testCreditComputation();
  console.log("\n=== All Frontend Tests Complete ===");
}

runTests().catch(console.error);
