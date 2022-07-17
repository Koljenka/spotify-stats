FROM nginx:alpine
RUN apk --no-cache update && apk --no-cache add libssl1.1=1.1.1q-r0
RUN apk --no-cache update && apk --no-cache add libcurl=7.83.1-r2
RUN apk --no-cache update && apk --no-cache add libcrypto1.1=1.1.1q-r0
RUN apk --no-cache update && apk --no-cache add curl=7.83.1-r2
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./dist/spotify-stats /usr/share/nginx/html
