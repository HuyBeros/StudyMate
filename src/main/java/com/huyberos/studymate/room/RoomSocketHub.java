package com.huyberos.studymate.room;

import jakarta.websocket.CloseReason;
import jakarta.websocket.Endpoint;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerContainer;
import jakarta.websocket.server.ServerEndpointConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.servlet.context.ServletWebServerInitializedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
class RoomSocketHub {
    private static final CloseReason UNAUTHORIZED =
            new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, "Room authorization required");
    private final RoomService rooms;
    private final Set<String> origins;
    private final ConcurrentHashMap<String, Ticket> tickets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Session, Ticket> clients = new ConcurrentHashMap<>();

    record Ticket(UUID room, long user, Instant redeemBy, Instant validUntil) {}

    RoomSocketHub(RoomService rooms, @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.rooms = rooms;
        origins = Set.copyOf(java.util.List.of(frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173",
                "http://localhost:8080", "http://127.0.0.1:8080"));
    }

    @EventListener
    public void register(ServletWebServerInitializedEvent event) throws jakarta.websocket.DeploymentException {
        var context = event.getApplicationContext().getServletContext();
        var container = (ServerContainer) context.getAttribute(ServerContainer.class.getName());
        if (container == null) throw new IllegalStateException("WebSocket server container is unavailable");
        var endpoint = ServerEndpointConfig.Builder.create(RoomEndpoint.class, "/ws/study-room")
                .configurator(new ServerEndpointConfig.Configurator() {
                    @Override public boolean checkOrigin(String origin) { return origin != null && origins.contains(origin); }
                    @Override public <T> T getEndpointInstance(Class<T> type) { return type.cast(new RoomEndpoint()); }
                }).build();
        container.addEndpoint(endpoint);
    }

    synchronized String issue(UUID room, long user, Instant tokenExpiry) {
        var now = Instant.now();
        tickets.entrySet().removeIf(entry -> !entry.getValue().redeemBy().isAfter(now));
        long pending = tickets.values().stream().filter(ticket -> matches(ticket, room, user)).count();
        if (tickets.size() >= 512 || pending >= 4)
            throw new com.huyberos.studymate.exception.ServiceUnavailableException("Hãy thử kết nối lại sau.");
        String key = UUID.randomUUID().toString();
        tickets.put(key, new Ticket(room, user, now.plusSeconds(20), tokenExpiry));
        return key;
    }

    void changed(UUID room) {
        clients.forEach((socket, ticket) -> {
            if (ticket.room().equals(room) && ticket.validUntil().isAfter(Instant.now()) && socket.isOpen()) {
                signal(socket, "changed");
            }
        });
    }

    void disconnect(UUID room, Long user) {
        tickets.entrySet().removeIf(entry -> matches(entry.getValue(), room, user));
        clients.forEach((socket, ticket) -> { if (matches(ticket, room, user)) close(socket); });
    }

    private boolean matches(Ticket ticket, UUID room, Long user) {
        return ticket.room().equals(room) && (user == null || ticket.user() == user);
    }

    private void receive(Session socket, String message) {
        var active = clients.get(socket);
        if (active != null) {
            if (!message.equals("ping") || !active.validUntil().isAfter(Instant.now())
                    || !rooms.socketMembership(active.room(), active.user())) close(socket);
            return;
        }
        var ticket = tickets.remove(message);
        var now = Instant.now();
        if (ticket == null || !ticket.redeemBy().isAfter(now) || !ticket.validUntil().isAfter(now)
                || clients.size() >= 256 || !rooms.socketMembership(ticket.room(), ticket.user())) {
            close(socket);
            return;
        }
        clients.put(socket, ticket);
        signal(socket, "ready");
    }

    private void signal(Session socket, String message) {
        synchronized (socket) {
            try { if (socket.isOpen()) socket.getBasicRemote().sendText(message); }
            catch (IOException | RuntimeException ignored) { close(socket); }
        }
    }

    private void close(Session socket) {
        clients.remove(socket);
        try { socket.close(UNAUTHORIZED); }
        catch (IOException | RuntimeException ignored) { /* Already closed. */ }
    }

    public final class RoomEndpoint extends Endpoint {
        @Override public void onOpen(Session socket, EndpointConfig config) {
            socket.setMaxTextMessageBufferSize(128);
            socket.setMaxIdleTimeout(65_000);
            socket.getUserProperties().put("org.apache.tomcat.websocket.BLOCKING_SEND_TIMEOUT", 3_000L);
            socket.addMessageHandler(String.class, message -> receive(socket, message));
            CompletableFuture.delayedExecutor(8, TimeUnit.SECONDS).execute(() -> {
                if (socket.isOpen() && !clients.containsKey(socket)) close(socket);
            });
        }
        @Override public void onClose(Session socket, CloseReason reason) { clients.remove(socket); }
        @Override public void onError(Session socket, Throwable error) { close(socket); }
    }
}
