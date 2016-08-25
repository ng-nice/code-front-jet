FROM node

MAINTAINER caogaojin

RUN git clone -b master https://github.com/invenfantasy/code-front-jet && \
    cd /code-front-jet && npm install -g && rm -rf /code-front-jet
