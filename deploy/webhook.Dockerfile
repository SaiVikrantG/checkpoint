FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git
RUN go install github.com/adnanh/webhook@latest

FROM alpine:3.21

RUN apk add --no-cache docker-cli docker-cli-compose curl bash
COPY --from=builder /go/bin/webhook /usr/local/bin/webhook

ENTRYPOINT ["/usr/local/bin/webhook"]
