FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py valuation_engine.py ./
EXPOSE 5002
CMD ["python", "main.py"]
