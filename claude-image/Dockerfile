# Use the official slim Node.js image (Debian-based)
FROM node:20

# Install dependencies needed for some skills (e.g., PDF generation may need libglib)
# Not strictly required for basic CLI, but included for robustness.
#RUN sed -i 's|deb.debian.org|ftp.us.debian.org|g' /etc/apt/sources.list.d/debian.sources || true && \

#RUN apt-get update --fix-missing || (sleep 5 && apt-get update --fix-missing) && \
#    apt-get install -y --no-install-recommends \
#        libglib2.0-0 \
#        libnss3 \
#        libatk-bridge2.0-0 \
#        libdrm2 \
#        libxkbcommon0 \
#        libgbm1 \
#        libasound2 \
#    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create the Claude configuration directory
RUN mkdir -p /root/.claude

# Copy the entire .claude folder (skills + any other config)
COPY .claude /root/.claude/

RUN chmod -R 755 /root/.claude   # Allows reading by any user

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

# Switch to non‑root user (node, UID 1000)
USER node

ENTRYPOINT ["/entrypoint.sh"]