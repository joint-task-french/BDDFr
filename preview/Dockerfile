FROM node:20-alpine

RUN apk add --no-cache git nginx gettext

RUN mkdir -p /var/www/html /tmp/workdir /run/nginx

COPY nginx.conf.template /etc/nginx/http.d/default.conf.template
COPY sync.sh /sync.sh
RUN chmod +x /sync.sh

EXPOSE 80

CMD envsubst '${BASE_PATH}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf && /sync.sh & nginx -g 'daemon off;'