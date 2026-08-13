FROM docker.1ms.run/library/python:3.12-slim

WORKDIR /app

# Use Aliyun mirror for faster pip installs
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=300 --retries 3 -r requirements.txt

COPY app/ app/
COPY data/ data/

# Train model during build
COPY train_model.py .
RUN mkdir -p app && python train_model.py

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
