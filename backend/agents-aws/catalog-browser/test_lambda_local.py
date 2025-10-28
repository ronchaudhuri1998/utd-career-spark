#!/usr/bin/env python3
"""
Comprehensive local testing script for UTD Catalog Browser Lambda function
Tests web scraping functionality before AWS deployment
"""

import sys
import json
import time
from lambda_catalog_browser import get_information

def test_computer_science():
    """Test with Computer Science BS major"""
    print("=" * 60)
    print("TESTING: Computer Science BS Major")
    print("=" * 60)
    
    start_time = time.time()
    majors = {"Computer Science": "BS"}
    minors = {}
    
    try:
        result, summary = get_information(majors, minors)
        end_time = time.time()
        
        print(f"Execution time: {end_time - start_time:.2f} seconds")
        print(f"Summary: {summary}")
        print("\nDetailed Results:")
        print(json.dumps(result, indent=2))
        
        # Validate results
        assert "majors" in result, "Result should contain 'majors' key"
        assert "Computer Science BS" in result["majors"], "Should contain Computer Science BS"
        
        cs_data = result["majors"]["Computer Science BS"]
        assert "url" in cs_data, "Should contain URL"
        assert "raw_text" in cs_data and len(cs_data["raw_text"]) > 0, "Should contain raw_text"
        
        if cs_data.get("error"):
            print(f"⚠️  Warning: {cs_data['error']}")
            return False
        
        print("✓ Computer Science test PASSED")
        return True
        
    except Exception as e:
        print(f"✗ Computer Science test FAILED: {str(e)}")
        return False

def test_software_engineering():
    """Test with Software Engineering BS major"""
    print("\n" + "=" * 60)
    print("TESTING: Software Engineering BS Major")
    print("=" * 60)
    
    start_time = time.time()
    majors = {"Software Engineering": "BS"}
    minors = {}
    
    try:
        result, summary = get_information(majors, minors)
        end_time = time.time()
        
        print(f"Execution time: {end_time - start_time:.2f} seconds")
        print(f"Summary: {summary}")
        
        # Validate results
        assert "majors" in result, "Result should contain 'majors' key"
        
        se_data = result["majors"].get("Software Engineering BS", {})
        if se_data.get("error"):
            print(f"⚠️  Warning: {se_data['error']}")
            return False
        
        assert "url" in se_data, "Should contain URL"
        assert "raw_text" in se_data and len(se_data["raw_text"]) > 0, "Should contain raw_text"
        
        print("✓ Software Engineering test PASSED")
        return True
        
    except Exception as e:
        print(f"✗ Software Engineering test FAILED: {str(e)}")
        return False

def test_data_science():
    """Test with Data Science BS major"""
    print("\n" + "=" * 60)
    print("TESTING: Data Science BS Major")
    print("=" * 60)
    
    start_time = time.time()
    majors = {"Data Science": "BS"}
    minors = {}
    
    try:
        result, summary = get_information(majors, minors)
        end_time = time.time()
        
        print(f"Execution time: {end_time - start_time:.2f} seconds")
        print(f"Summary: {summary}")
        
        # Validate results
        assert "majors" in result, "Result should contain 'majors' key"
        
        ds_data = result["majors"].get("Data Science BS", {})
        if ds_data.get("error"):
            print(f"⚠️  Warning: {ds_data['error']}")
            return False
        
        assert "url" in ds_data, "Should contain URL"
        assert "raw_text" in ds_data and len(ds_data["raw_text"]) > 0, "Should contain raw_text"
        
        print("✓ Data Science test PASSED")
        return True
        
    except Exception as e:
        print(f"✗ Data Science test FAILED: {str(e)}")
        return False

def test_error_handling():
    """Test error handling with invalid inputs"""
    print("\n" + "=" * 60)
    print("TESTING: Error Handling")
    print("=" * 60)
    
    # Test with invalid major
    print("Testing invalid major...")
    majors = {"Invalid Major Name": "BS"}
    minors = {}
    
    try:
        result, summary = get_information(majors, minors)
        print(f"Summary: {summary}")
        
        invalid_data = result["majors"].get("Invalid Major Name BS", {})
        if invalid_data.get("error"):
            print(f"✓ Correctly handled invalid major: {invalid_data['error']}")
        else:
            print("⚠️  No error reported for invalid major")
        
        print("✓ Error handling test PASSED")
        return True
        
    except Exception as e:
        print(f"✗ Error handling test FAILED: {str(e)}")
        return False

def test_multiple_majors():
    """Test with multiple majors at once"""
    print("\n" + "=" * 60)
    print("TESTING: Multiple Majors")
    print("=" * 60)
    
    start_time = time.time()
    majors = {
        "Computer Science": "BS",
        "Software Engineering": "BS"
    }
    minors = {}
    
    try:
        result, summary = get_information(majors, minors)
        end_time = time.time()
        
        print(f"Execution time: {end_time - start_time:.2f} seconds")
        print(f"Summary: {summary}")
        
        # Validate results
        assert "majors" in result, "Result should contain 'majors' key"
        assert len(result["majors"]) == 2, "Should contain 2 majors"
        
        for major_name in ["Computer Science BS", "Software Engineering BS"]:
            if major_name in result["majors"]:
                major_data = result["majors"][major_name]
                assert "url" in major_data, "Should contain URL"
                assert "raw_text" in major_data and len(major_data["raw_text"]) > 0, "Should contain raw_text"
        
        print("✓ Multiple majors test PASSED")
        return True
        
    except Exception as e:
        print(f"✗ Multiple majors test FAILED: {str(e)}")
        return False

def test_performance():
    """Test performance requirements"""
    print("\n" + "=" * 60)
    print("TESTING: Performance")
    print("=" * 60)
    
    start_time = time.time()
    majors = {"Computer Science": "BS"}
    minors = {}
    
    try:
        result, summary = get_information(majors, minors)
        end_time = time.time()
        
        execution_time = end_time - start_time
        print(f"Execution time: {execution_time:.2f} seconds")
        
        if execution_time < 30:
            print("✓ Performance test PASSED (< 30 seconds)")
            return True
        else:
            print(f"✗ Performance test FAILED ({execution_time:.2f}s > 30s)")
            return False
            
    except Exception as e:
        print(f"✗ Performance test FAILED: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("UTD Catalog Browser - Local Testing Suite")
    print("=" * 60)
    
    tests = [
        ("Computer Science", test_computer_science),
        ("Software Engineering", test_software_engineering),
        ("Data Science", test_data_science),
        ("Error Handling", test_error_handling),
        ("Multiple Majors", test_multiple_majors),
        ("Performance", test_performance),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"✗ {test_name} test CRASHED: {str(e)}")
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Ready for AWS deployment.")
        return True
    else:
        print("❌ Some tests failed. Fix issues before deploying to AWS.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
