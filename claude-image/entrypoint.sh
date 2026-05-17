#!/bin/bash
# entrypoint.sh

# If EXA_API_KEY is provided via environment, replace the placeholder in the MCP config
if [ -n "$EXA_API_KEY" ]; then
    # The MCP config is stored in /root/.claude/mcp.json (or similar)
    # We'll use jq (if available) or sed to replace the header value.
    # Assuming the config looks like:
    # {
    #   "mcpServers": {
    #     "exa": {
    #       "transport": "http",
    #       "url": "https://mcp.exa.ai/mcp",
    #       "headers": { "x-api-key": "PLACEHOLDER" }
    #     }
    #   }
    # }
    CONFIG_FILE="/root/.claude/mcp.json"
    if [ -f "$CONFIG_FILE" ]; then
        # Using sed (simpler, doesn't require jq)
        sed -i "s/PLACEHOLDER/$EXA_API_KEY/g" "$CONFIG_FILE"
        echo "Exa API key injected into MCP config."
    fi
fi

# Now run the claude command with all arguments passed to this script
exec claude "$@"