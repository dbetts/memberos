FROM postgres:17-bookworm

# Install build dependencies, PostgreSQL apt repo, and extensions
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    gnupg \
    build-essential \
    git \
    postgresql-server-dev-17 \
    && echo "deb https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update && apt-get install -y \
    postgresql-plpython3-17 \
    postgresql-17-postgis-3 \
    postgresql-17-postgis-3-scripts \
    && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector \
    && apt-get remove -y build-essential git postgresql-server-dev-17 \
    && apt-get autoremove -y \
    && apt-get clean && rm -rf /var/lib/apt/lists/*