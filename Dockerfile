FROM nginxinc/nginx-unprivileged:1.28-alpine

COPY --chown=101:101 index.html /usr/share/nginx/html/index.html
COPY --chown=101:101 robots.txt sitemap.xml 404.html /usr/share/nginx/html/
COPY --chown=101:101 assets/ /usr/share/nginx/html/assets/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
