FROM python:3.9.16-slim

WORKDIR /app

# NOTE(krishan711): GCC (and others) needed to build some dependencies. Remove when everything has a wheel.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git gcc \
    && apt-get install -y --no-install-recommends gcc libc-dev \
    && pip install bitarray==1.2.2 \
    && pip install lru-dict==1.1.7 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove gcc libc-dev

COPY requirements-dev.txt $WORKDIR
RUN pip install -r requirements-dev.txt
COPY requirements.txt $WORKDIR
RUN pip install -r requirements.txt

COPY . $WORKDIR

EXPOSE 5000
CMD ["./start-api.sh"]
