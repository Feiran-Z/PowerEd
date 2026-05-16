# Use the official slim Node.js image (Debian-based)
FROM node:20-slim

# Install dependencies needed for some skills (e.g., PDF generation may need libglib)
# Not strictly required for basic CLI, but included for robustness.
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create the Claude configuration directory
RUN mkdir -p /root/.claude

# Copy the entire .claude folder (skills + any other config)
COPY .claude /root/.claude/

# Pre-configure the Exa MCP server (with a placeholder API key)
# The actual key will be passed via environment variable at runtime.
# We use a dummy value here; it will be overwritten when the container runs.
RUN claude mcp add --transport http exa https://mcp.exa.ai/mcp \
    --header "x-api-key: PLACEHOLDER"

# Set the working directory where user files will be mounted
WORKDIR /workspace

# Optional: use a custom entrypoint script to handle environment variables
# (see explanation below)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]