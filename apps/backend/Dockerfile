# syntax=docker/dockerfile:1

FROM golang:1.26.2-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/backend ./cmd/backend/main.go

FROM alpine:3.21

RUN apk add --no-cache ca-certificates \
    && addgroup -S app && adduser -S app -G app

COPY --from=builder /out/backend /app/backend

USER app
WORKDIR /app

EXPOSE 8080

ENTRYPOINT ["/app/backend"]
