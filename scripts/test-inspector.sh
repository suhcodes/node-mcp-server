#!/bin/bash

# Test script for MCP Inspector integration
# This script validates the MCP server using the inspector CLI

set -e

echo "==================================="
echo "MCP Inspector Integration Tests"
echo "==================================="
echo ""

CONFIG_FILE="inspector-config.json"
SERVER_NAME="node-mcp-server"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"

    echo -n "Testing: $test_name... "

    if output=$(eval "$command" 2>&1); then
        # Use extended regex to handle patterns
        if echo "$output" | grep -qE "$expected_pattern"; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAILED${NC} (pattern not found)"
            echo "Expected pattern: $expected_pattern"
            echo "Output: $output"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (command failed)"
        echo "Output: $output"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1. Server Connection Tests"
echo "-----------------------------------"

run_test "List available tools" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/list" \
    '"name": "ping"'

echo ""
echo "2. Ping Tool - Basic Health Check"
echo "-----------------------------------"

run_test "Ping tool responds" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{}'" \
    'status.*healthy'

run_test "Server info present" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{}'" \
    'name.*node-mcp-server'

run_test "Server version present" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{}'" \
    'version.*0\.1\.0'

echo ""
echo "3. Custom Message Tests"
echo "-----------------------------------"

run_test "Ping with custom message" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{\"message\":\"test\"}'" \
    'message.*test'

run_test "Ping without message (optional param)" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{}'" \
    'status.*healthy'

echo ""
echo "4. Response Structure"
echo "-----------------------------------"

run_test "Timestamp present" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{}'" \
    'timestamp'

run_test "Server section present" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name ping --arguments '{}'" \
    'server'

echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
