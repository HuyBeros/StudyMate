package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.security.jwt.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext
class StudyRoomIntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired JwtUtil jwt;
    @Autowired ObjectMapper json;
    private final HttpClient http = HttpClient.newHttpClient();
    private final ArrayList<Long> testUsers = new ArrayList<>();
    private final ArrayList<WebSocket> connections = new ArrayList<>();

    @AfterEach
    void clean() {
        connections.forEach(WebSocket::abort);
        users.deleteAllByIdInBatch(testUsers);
    }

    @Test
    void membersReceiveRealtimeChangesAndRecoverTimerWhileOutsiderCannotReadChatOrImages() throws Exception {
        String host = user(), member = user(), outsider = user();
        String id = call("POST", "/api/study-rooms", host, Map.of("name", "Phòng ôn thi"), 200).asText();
        String path = "/api/study-rooms/" + id;
        assertEquals("WAITING", call("GET", path + "/preview", member, null, 200).path("phase").asText());
        call("GET", path, outsider, null, 404);
        call("POST", path + "/socket-ticket", outsider, null, 404);
        call("POST", path + "/join", member, null, 200);
        call("POST", path + "/timer", member, Map.of("action", "START", "revision", 0), 404);

        var events = new LinkedBlockingQueue<String>();
        WebSocket socket = connect(path, member, events);
        var focus = call("POST", path + "/timer", host, Map.of("action", "START", "revision", 0), 200);
        assertEquals("FOCUS", focus.path("phase").asText());
        assertEquals("changed", events.poll(5, TimeUnit.SECONDS));
        assertEquals(focus.path("deadline"), call("GET", path, member, null, 200).path("deadline"));
        call("POST", path + "/timer", host, Map.of("action", "START", "revision", 0), 409);

        socket.abort();
        var reconnected = new LinkedBlockingQueue<String>();
        connect(path, member, reconnected);
        var paused = call("POST", path + "/timer", host, Map.of("action", "PAUSE", "revision", 1), 200);
        assertTrue(paused.path("paused").asBoolean());
        assertEquals("changed", reconnected.poll(5, TimeUnit.SECONDS));
        assertEquals(paused.path("remainingMs"), call("GET", path, member, null, 200).path("remainingMs"));

        UUID messageId = UUID.randomUUID();
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(12, 12, BufferedImage.TYPE_INT_RGB), "png", bytes);
        upload(path, member, messageId, bytes.toByteArray());
        assertEquals("changed", reconnected.poll(5, TimeUnit.SECONDS));
        upload(path, member, messageId, bytes.toByteArray());
        var messages = call("GET", path, host, null, 200).path("messages");
        assertEquals(1, messages.size());
        assertEquals("Em vướng ở dòng 3", messages.get(0).path("text").asText());
        String image = path + "/images/" + messages.get(0).path("id").asLong();
        var downloaded = http.send(request(image, host).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        assertEquals(200, downloaded.statusCode());
        assertEquals("image/png", downloaded.headers().firstValue("Content-Type").orElseThrow());
        call("GET", image, outsider, null, 404);
        call("POST", path + "/leave", member, null, 200);
        call("GET", image, member, null, 404);
        call("DELETE", path, host, null, 200);
        call("GET", path + "/preview", outsider, null, 404);
    }

    private WebSocket connect(String path, String token, LinkedBlockingQueue<String> events) throws Exception {
        String ticket = call("POST", path + "/socket-ticket", token, null, 200).asText();
        WebSocket socket = http.newWebSocketBuilder().connectTimeout(Duration.ofSeconds(5))
                .header("Origin", "http://localhost:5173")
                .buildAsync(URI.create("ws://127.0.0.1:" + port + "/ws/study-room"), new WebSocket.Listener() {
                    @Override public java.util.concurrent.CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
                        events.add(data.toString());
                        ws.request(1);
                        return null;
                    }
                }).get(5, TimeUnit.SECONDS);
        connections.add(socket);
        socket.sendText(ticket, true).get(5, TimeUnit.SECONDS);
        assertEquals("ready", events.poll(5, TimeUnit.SECONDS));
        return socket;
    }

    private void upload(String path, String token, UUID id, byte[] image) throws Exception {
        String boundary = "studymate-test-boundary";
        var body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"clientId\"\r\n\r\n" + id
                + "\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"text\"\r\n\r\nEm vướng ở dòng 3"
                + "\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.png\""
                + "\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(image);
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        var result = http.send(request(path + "/messages", token).header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray())).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, result.statusCode(), result.body());
    }

    private String user() {
        var user = users.saveAndFlush(User.builder().username("room-" + UUID.randomUUID().toString().substring(0, 10))
                .fullName("Người học kiểm thử").build());
        testUsers.add(user.getId());
        return jwt.generateAccessToken(user.getId(), null);
    }

    private HttpRequest.Builder request(String path, String token) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(7)).header("Authorization", "Bearer " + token);
    }

    private JsonNode call(String method, String path, String token, Object payload, int status) throws Exception {
        var builder = request(path, token);
        var body = payload == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload));
        if (payload != null) builder.header("Content-Type", "application/json");
        var result = http.send(builder.method(method, body).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(status, result.statusCode(), result.body());
        return json.readTree(result.body()).path("data");
    }
}
