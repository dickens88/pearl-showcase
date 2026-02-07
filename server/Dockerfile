FROM python:3.11-slim

WORKDIR /app

# 安装 gunicorn
RUN pip install --no-cache-dir gunicorn

# 复制需求文件并安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5000

# 运行应用
# 使用 gunicorn 运行 Flask 应用
# 绑定到 0.0.0.0 以便在容器外访问
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:create_app()"]
